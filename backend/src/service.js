import fs from 'fs';
import jwt from 'jsonwebtoken';
import AsyncLock from 'async-lock';
import { InputError, AccessError, } from './error';

const lock = new AsyncLock();

const JWT_SECRET = 'thedogwastheceo';
const DATABASE_FILE = './database.json';

/***************************************************************
                       State Management
***************************************************************/

let users = {};
let posts = {};
let nextMessageId = 1;

const update = (users, posts, nextMessageId) =>
  new Promise((resolve, reject) => {
    lock.acquire('saveData', () => {
      try {
        fs.writeFileSync(DATABASE_FILE, JSON.stringify({
          users,
          posts,
          nextMessageId,
        }, null, 2));
        resolve();
      } catch {
        reject(new Error('Writing to database failed'));
      }
    });
  });

export const save = () => update(users, posts, nextMessageId);
export const reset = () => {
  update({}, {}, 1);
  users = {};
  posts = {};
  nextMessageId = 1;
};

try {
  const data = JSON.parse(fs.readFileSync(DATABASE_FILE));
  users = data.users;
  posts = data.posts;
  nextMessageId = data.nextMessageId;
} catch {
  console.log('WARNING: No database found, create a new one');
  save();
}

/***************************************************************
                        Helper Functions
***************************************************************/

const newUserId = _ => generateId(Object.keys(users), 99999);
const newJobId = _ => generateId(Object.keys(posts));
const getNextMessageId = _ => {
  nextMessageId += 1;
  return nextMessageId - 1;
};

const dataLock = callback => new Promise((resolve, reject) => {
  lock.acquire('dataLock', callback(resolve, reject));
});

const randNum = max => Math.round(Math.random() * (max - Math.floor(max / 10)) + Math.floor(max / 10));
const generateId = (currentList, max = 999999) => {
  let R = randNum(max).toString();
  while (currentList.includes(R)) {
    R = randNum(max).toString();
  }
  return R;
};

export const assertValidUserId = (userId) => dataLock((resolve, reject) => {
  if (!(userId in users)) {
    return reject(new InputError('Invalid user ID'));
  }
  resolve();
});

/***************************************************************
                         Auth Functions
***************************************************************/

export const getUserIdFromAuthorization = authorization => {
  try {
    const token = authorization.replace('Bearer ', '');
    const { userId, } = jwt.verify(token, JWT_SECRET);
    if (!(userId in users)) {
      throw new AccessError('Invalid token');
    }
    return userId.toString();
  } catch {
    throw new AccessError('Invalid token');
  }
};

export const getUserIdFromEmail = email => {
  return Object.keys(users).find(id => users[id].email === email);
};

export const login = (email, password) => dataLock((resolve, reject) => {
  const userId = getUserIdFromEmail(email);
  if (userId !== undefined && users[userId].password === password) {
    resolve({
      token: jwt.sign({ userId, }, JWT_SECRET, { algorithm: 'HS256', }),
      userId: parseInt(userId, 10),
    });
  }
  reject(new InputError('Invalid email or password'));
});

export const register = (email, password, name) => dataLock((resolve, reject) => {
  if (getUserIdFromEmail(email) !== undefined) {
    return reject(new InputError('Email address already registered'));
  }
  const userId = newUserId();
  users[userId] = {
    email,
    name,
    password,
    image: undefined,
    watcheeUserIds: {},
  };
  resolve({
    token: jwt.sign({ userId, }, JWT_SECRET, { algorithm: 'HS256', }),
    userId: parseInt(userId, 10),
  });
});

/***************************************************************
                       Job Posts Functions
***************************************************************/

export const assertValidJobPost = (jobPostId) => dataLock((resolve, reject) => {
  if (!(jobPostId in posts)) {
    return reject(new InputError('Invalid job post ID'));
  }
  resolve();
});

export const assertCreatorOfJobPost = (userId, jobPostId) => {
  if (posts[jobPostId].creatorId !== parseInt(userId, 10)) {
    throw new AccessError('Authorised user is not the creator of this job post');
  }
};

export const assertWatcherOfJobPost = (userId, jobPostId) => {
  const { creatorId } = posts[jobPostId];
  const { watcheeUserIds } = users[creatorId];
  if (!Object.keys(watcheeUserIds).includes(userId)) {
    throw new AccessError('Authorised user is not a watcher of post author');
  }
};

const buildJobObject = (post) => {
  return {
    ...post,
    likes: Object.keys(post.likes).map(i => ({
      userId: parseInt(i, 10),
      userEmail: users[i].email,
      userName: users[i].name,
    })),
    comments: Object.keys(post.comments).map(i => {
      const { userId, comment } = post.comments[i];
      return {
        userId: parseInt(userId, 10),
        userEmail: users[userId].email,
        userName: users[userId].name,
        comment: comment,
      };
    }),
  };
};

export const getJobs = (authUserId, start) => dataLock((resolve, reject) => {
  if (Number.isNaN(start)) {
    return reject(new InputError('Invalid start value'));
  } else if (start < 0) {
    return reject(new InputError('Start value cannot be negative'));
  }
  const allPosts = Object.keys(posts).map(pid => posts[pid]);
  const relevantPosts = allPosts.filter(p => Object.keys(users[p.creatorId].watcheeUserIds).includes(authUserId));
  const expandedPosts = relevantPosts.map(buildJobObject);
  expandedPosts.sort((a, b) => (a.createdAt < b.createdAt) ? 1 : -1)
  resolve(expandedPosts.slice(start, start + 5));
});

export const postJob = (authUserId, image, title, start, description) => dataLock((resolve, reject) => {
  if (image === undefined || title === undefined || start === undefined || description === undefined) {
    reject(new InputError('Please enter all relevant fields'));
  }
  const newJob = {
    id: newJobId(),
    creatorId: parseInt(authUserId, 10),
    image,
    title,
    start,
    description,
    createdAt: new Date().toISOString(),
    likes: {},
    comments: [],
  };
  posts[newJob.id] = newJob;
  resolve(newJob.id)
});

export const updateJobPost = (authUserId, jobPostId, image, title, start, description) => dataLock((resolve, reject) => {
  if (image) posts[jobPostId].image = image;
  if (title) posts[jobPostId].title = title;
  if (start) posts[jobPostId].start = start;
  if (description) posts[jobPostId].description = description;
  resolve(posts[jobPostId]);
});

export const commentOnJobPost = (authUserId, jobPostId, comment) => dataLock((resolve, reject) => {
  posts[jobPostId].comments.push({
    userId: authUserId,
    comment,
  });
  resolve(posts[jobPostId]);
});

export const likeJobPost = (authUserId, jobPostId, turnon) => dataLock((resolve, reject) => {
  if (turnon) {
    posts[jobPostId].likes[authUserId] = true;
  } else {
    if (Object.keys(posts[jobPostId].likes).includes(authUserId)) {
      delete posts[jobPostId].likes[authUserId];
    }
  }
  resolve(posts[jobPostId]);
});

export const deleteJobPost = (authUserId, jobPostId) => dataLock((resolve, reject) => {
  delete posts[jobPostId];
  resolve();
});

/***************************************************************
                         User Functions
***************************************************************/

export const getUser = (userId) => dataLock((resolve, reject) => {
  const intid = parseInt(userId, 10);
  const userDetails = {
    ...users[userId],
    password: undefined,
    id: intid,
    watcheeUserIds: Object.keys(users[userId].watcheeUserIds).map(i => parseInt(i, 10)),
    jobs: Object.keys(posts).map(pid => posts[pid]).filter(post => post.creatorId === intid).map(buildJobObject),
  };
  resolve(userDetails);
});

export const watchUser = (watcherUserId, watcheeUserId, turnon) => dataLock((resolve, reject) => {
  if (turnon === undefined) {
    reject(new InputError('turnon property is missing'));
    return;
  }
  const userDetails = { ...users[watcheeUserId], };
  if (turnon) {
    userDetails.watcheeUserIds[watcherUserId] = true;
  } else {
    if (Object.keys(userDetails.watcheeUserIds).includes(watcherUserId)) {
      delete userDetails.watcheeUserIds[watcherUserId];
    }
  }
  resolve();
});

export const updateProfile = (authUserId, email, password, name, image) => dataLock((resolve, reject) => {
  if (name) { users[authUserId].name = name; }
  if (password) { users[authUserId].password = password; }
  if (image) { users[authUserId].image = image; }
  if (email && getUserIdFromEmail(email) !== undefined) {
    return reject(new InputError('Email address already taken'));
  } else if (email) { users[authUserId].email = email; }
  resolve();
});
