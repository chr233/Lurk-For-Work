import request from 'supertest';
import server from '../src/server';
import { reset } from '../src/service';

const IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';

const INVALID_TOKEN = 'Cactusbot';

const USER1 = {
  name: 'Betty',
  email: 'betty@email.com',
  password: 'cardigan',
  image: IMAGE,
};
const USER2 = {
  name: 'Augustine',
  email: 'augustine@email.com',
  password: 'august',
  image: IMAGE,
};
const USER3 = {
  name: 'James',
  email: 'james@email.com',
  password: 'betty',
};
const JOB1 = {
  title: 'Hello Kitty Director',
  image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
  start: '2011-10-05T14:48:00.000Z',
  description: 'Dedicated technical wizard with a passion and interest in human relationships',
};
const JOB2 = {
  title: 'Lunch time master',
  image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
  start: '2011-09-05T14:48:00.000Z',
  description: 'CTO of the food',
};
const JOB3 = {
  title: 'Unique title',
  image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
  start: '2007-09-05T14:48:00.000Z',
  description: 'CEO of the box',
};

const postTry = async (path, status, payload, token) => sendTry('post', path, status, payload, token);
const getTry = async (path, status, payload, token) => sendTry('get', path, status, payload, token);
const deleteTry = async (path, status, payload, token) => sendTry('delete', path, status, payload, token);
const putTry = async (path, status, payload, token) => sendTry('put', path, status, payload, token);

const sendTry = async (typeFn, path, status = 200, payload = {}, token = null) => {
  let req = request(server);
  if (typeFn === 'post') {
    req = req.post(path);
  } else if (typeFn === 'get') {
    req = req.get(path);
  } else if (typeFn === 'delete') {
    req = req.delete(path);
  } else if (typeFn === 'put') {
    req = req.put(path);
  }
  if (token !== null) {
    req = req.set('Authorization', `Bearer ${token}`);
  }
  const response = await req.send(payload);
  if (response.statusCode !== status) {
    console.log(response.body);
  }
  expect(response.statusCode).toBe(status);
  return response.body;
};

const validToken = async (user) => {
  const { token } = await postTry('/auth/login', 200, {
    email: user.email,
    password: user.password,
  });
  return token;
}

const publicChannelId = async () => {
  const { channels } = await getTry('/channel', 200, {}, await validToken(USER1));
  return channels[0].private ? channels[1].id : channels[0].id;
};

const privateChannelId = async () => {
  const { channels } = await getTry('/channel', 200, {}, await validToken(USER1));
  return channels[0].private ? channels[0].id : channels[1].id;
};

const getUserId = async (user) => {
  const { users, } = await getTry('/user', 200, {}, await validToken(USER1));
  return users.find(u => u.email === user.email).id;
}

describe('Auth tests', () => {

  beforeAll(() => {
    reset();
  });

  beforeAll(() => {
    server.close();
  });

  let firstUserId = null;

  test('Registration of initial user', async () => {
    const { token, userId, } = await postTry('/auth/register', 200, {
      email: USER1.email,
      password: USER1.password,
      name: USER1.name,
    });
    expect(token instanceof String);
    firstUserId = userId;
  });

  test('Inability to re-register a user', async () => {
    await postTry('/auth/register', 400, {
      email: USER1.email,
      password: USER1.password,
      name: USER1.name,
    });
  });

  test('Registration of second user', async () => {
    const { token, } = await postTry('/auth/register', 200, {
      email: USER2.email,
      password: USER2.password,
      name: USER2.name,
    });
    expect(token instanceof String);
  });

  test('Login to an existing user', async () => {
    const { token, userId, } = await postTry('/auth/login', 200, {
      email: USER1.email,
      password: USER1.password,
    });
    expect(token instanceof String);
    expect(userId).toBe(firstUserId);
  });

  test('Login attempt with invalid credentials 1', async () => {
    await postTry('/auth/login', 400, {
      email: 'inez@email.com',
      password: USER1.password,
    });
  });

  test('Login attempt with invalid credentials 2', async () => {
    await postTry('/auth/login', 400, {
      email: USER1.email,
      password: 'car again',
    });
  });
});

describe('User tests', () => {

  const globals = {};

  beforeEach(async () => {
    reset();

    globals.ret1 = await postTry('/auth/register', 200, {
      email: USER1.email,
      password: USER1.password,
      name: USER1.name,
    });

    globals.ret2 = await postTry('/auth/register', 200, {
      email: USER2.email,
      password: USER2.password,
      name: USER2.name,
    });

    globals.ret3 = await postTry('/auth/register', 200, {
      email: USER3.email,
      password: USER3.password,
      name: USER3.name,
    });
  });

  beforeAll(() => {
    server.close();
  });

  describe('GET /user should', () => {

    it('fail with a bad token', async () => {
      await getTry('/user', 403, {}, INVALID_TOKEN);
    });
    
    it('fail with a no info', async () => {
      const userInfo = await getTry('/user', 400, {}, await globals.ret1.token);
    });
    
    it('produce correct results for valid input', async () => {
      const id = globals.ret1.userId;
      const userInfo = await getTry(`/user?userId=${id}`, 200, {}, await globals.ret1.token);
      expect(userInfo.id).toBe(id);
      expect(userInfo.email).toBe(USER1.email);
      expect(userInfo.name).toBe(USER1.name);
      expect(userInfo.password).toBe(undefined);
      expect(userInfo.image).toBe(undefined);
      expect(userInfo.watcheeUserIds).toEqual(expect.arrayContaining([]));
      expect(userInfo.jobs).toEqual(expect.arrayContaining([]));
    });
  });

  describe('PUT /user should', () => {
    it('fail with a bad token', async () => {
      await putTry('/user', 403, {}, INVALID_TOKEN);
    });

    it('update only the name', async () => {
      const id = globals.ret1.userId;
      await putTry(`/user`, 200, { id, name: 'TestingName' }, await globals.ret1.token);

      const userInfo = await getTry(`/user?userId=${id}`, 200, {}, await globals.ret1.token);
      expect(userInfo.id).toBe(id);
      expect(userInfo.email).toBe(USER1.email);
      expect(userInfo.name).toBe('TestingName');
      expect(userInfo.image).toBe(undefined);
      expect(userInfo.watcheeUserIds).toEqual(expect.arrayContaining([]));

      await postTry('/auth/login', 200, { email: USER1.email, password: USER1.password, });
    });

    it('update only the email', async () => {
      const id = globals.ret1.userId;
      await putTry(`/user`, 200, { id, email: 'newemail@gmail.com' }, await globals.ret1.token);

      const userInfo = await getTry(`/user?userId=${id}`, 200, {}, await globals.ret1.token);
      expect(userInfo.id).toBe(id);
      expect(userInfo.email).toBe('newemail@gmail.com');
      expect(userInfo.name).toBe(USER1.name);
      expect(userInfo.image).toBe(undefined);
      expect(userInfo.watcheeUserIds).toEqual(expect.arrayContaining([]));

      await postTry('/auth/login', 200, { email: 'newemail@gmail.com', password: USER1.password, });
    });

    it('update only the image', async () => {
      const id = globals.ret1.userId;
      await putTry(`/user`, 200, { id, image: USER1.image }, await globals.ret1.token);

      const userInfo = await getTry(`/user?userId=${id}`, 200, {}, await globals.ret1.token);
      expect(userInfo.id).toBe(id);
      expect(userInfo.email).toBe(USER1.email);
      expect(userInfo.name).toBe(USER1.name);
      expect(userInfo.image).toBe(USER1.image);
      expect(userInfo.watcheeUserIds).toEqual(expect.arrayContaining([]));

      await postTry('/auth/login', 200, { email: USER1.email, password: USER1.password, });
    });

    it('update only the password', async () => {
      const id = globals.ret1.userId;
      await putTry(`/user`, 200, { id, password: 'newpassword1234' }, await globals.ret1.token);

      const userInfo = await getTry(`/user?userId=${id}`, 200, {}, await globals.ret1.token);
      expect(userInfo.id).toBe(id);
      expect(userInfo.email).toBe(USER1.email);
      expect(userInfo.name).toBe(USER1.name);
      expect(userInfo.image).toBe(undefined);
      expect(userInfo.watcheeUserIds).toEqual(expect.arrayContaining([]));

      await postTry('/auth/login', 400, { email: USER1.email, password: USER1.password, });
      await postTry('/auth/login', 200, { email: USER1.email, password: 'newpassword1234', });
    });
  });

  describe('PUT /user/watch should', () => {
    it('fail with a bad token', async () => {
      await putTry('/user/watch', 403, {}, INVALID_TOKEN);
    });

    it('fail without the on property', async () => {
      await putTry(`/user/watch`, 400, { email: USER2.email }, await globals.ret1.token);

    });

    it('successfully watch another user by email', async () => {
      await putTry(`/user/watch`, 200, { email: USER2.email, turnon: true }, await globals.ret1.token);

      const userInfo = await getTry(`/user?userId=${globals.ret2.userId}`, 200, {}, await globals.ret1.token);
      expect(userInfo.watcheeUserIds).toEqual(expect.arrayContaining([ globals.ret1.userId ]));
    });

    it('successfully watch twice and see same result', async () => {
      await putTry(`/user/watch`, 200, { id: globals.ret2.userId, turnon: true }, await globals.ret1.token);

      const userInfo1 = await getTry(`/user?userId=${globals.ret2.userId}`, 200, {}, await globals.ret1.token);
      expect(userInfo1.watcheeUserIds).toEqual(expect.arrayContaining([ globals.ret1.userId ]));

      await putTry(`/user/watch`, 200, { id: globals.ret2.userId, turnon: true }, await globals.ret1.token);

      const userInfo2 = await getTry(`/user?userId=${globals.ret2.userId}`, 200, {}, await globals.ret1.token);
      expect(userInfo2.watcheeUserIds).toEqual(expect.arrayContaining([ globals.ret1.userId ]));
    });

    it('successfully unwatch something already unwatched and see same result', async () => {
      await putTry(`/user/watch`, 200, { id: globals.ret2.userId, turnon: false }, await globals.ret1.token);

      const userInfo1 = await getTry(`/user?userId=${globals.ret1.userId}`, 200, {}, await globals.ret1.token);
      expect(userInfo1.watcheeUserIds).toEqual(expect.arrayContaining([]));
    });

    it('successfully watch and unwatch something across two users', async () => {
      await putTry(`/user/watch`, 200, { id: globals.ret1.userId, turnon: true }, await globals.ret2.token);
      await putTry(`/user/watch`, 200, { id: globals.ret1.userId, turnon: true }, await globals.ret3.token);

      const userInfo1 = await getTry(`/user?userId=${globals.ret1.userId}`, 200, {}, await globals.ret1.token);
      expect(userInfo1.watcheeUserIds).toEqual(expect.arrayContaining([ globals.ret2.userId, globals.ret3.userId ]));

      await putTry(`/user/watch`, 200, { id: globals.ret2.userId, turnon: false }, await globals.ret1.token);

      const userInfo2 = await getTry(`/user?userId=${globals.ret1.userId}`, 200, {}, await globals.ret1.token);
      expect(userInfo2.watcheeUserIds).toEqual(expect.arrayContaining([ globals.ret3.userId ]));

      await putTry(`/user/watch`, 200, { id: globals.ret3.userId, turnon: false }, await globals.ret1.token);

      const userInfo3 = await getTry(`/user?userId=${globals.ret1.userId}`, 200, {}, await globals.ret1.token);
      expect(userInfo3.watcheeUserIds).toEqual(expect.arrayContaining([ ]));

    });
  });

});

describe('Job post tests', () => {

  const globals = {};

  beforeEach(async () => {
    reset();

    globals.ret1 = await postTry('/auth/register', 200, {
      email: USER1.email,
      password: USER1.password,
      name: USER1.name,
    });

    globals.ret2 = await postTry('/auth/register', 200, {
      email: USER2.email,
      password: USER2.password,
      name: USER2.name,
    });

    globals.ret3 = await postTry('/auth/register', 200, {
      email: USER3.email,
      password: USER3.password,
      name: USER3.name,
    });

    await putTry(`/user/watch`, 200, { id: globals.ret2.userId, turnon: true }, await globals.ret1.token);
    await putTry(`/user/watch`, 200, { id: globals.ret3.userId, turnon: true }, await globals.ret1.token);
    await putTry(`/user/watch`, 200, { id: globals.ret3.userId, turnon: true }, await globals.ret2.token);
    
  });


  beforeAll(() => {
    server.close();
  });

  describe('POST /job should', () => {
    it('fail with a bad token', async () => {
      await postTry('/job', 403, {}, INVALID_TOKEN);
    });

    it('fail without any properties', async () => {
      await postTry(`/job`, 400, { }, await globals.ret1.token);
    });

    it('can create a new valid job post', async () => {
      const job = await postTry(`/job`, 200, JOB1, await globals.ret1.token);

    });

  });

  describe('GET /job/feed should', () => {
    it('fail with a bad token', async () => {
      await getTry('/job/feed?start=0', 403, {}, INVALID_TOKEN);
    });

    it('return the right core elements for a basic job post', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret2.token);

      const jobs = await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token);
      expect(jobs.length).toBe(1);

      const job = jobs[0];
      expect(job.email).toBe(JOB1.email);
      expect(job.title).toBe(JOB1.title);
      expect(job.image).toBe(JOB1.image);
      expect(job.description).toBe(JOB1.description);
      expect(job.start).toBe(JOB1.start);
      expect(job.likes).toEqual(expect.arrayContaining([]));
      expect(job.comments).toEqual(expect.arrayContaining([]));
    });

    it('return the right elements for the right user', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret1.token);

      const jobs = await getTry(`/job/feed?start=0`, 200, {}, await globals.ret2.token);
      expect(jobs.length).toBe(0);
    });

    it('stores the correct number of job posts', async () => {
      await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      await postTry(`/job`, 200, JOB2, await globals.ret2.token);

      const jobs = await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token);
      expect(jobs.length).toBe(2);
    });

    it('correctly paginate', async () => {
      await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      await postTry(`/job`, 200, JOB2, await globals.ret2.token);
      await postTry(`/job`, 200, JOB3, await globals.ret2.token);
      await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      await postTry(`/job`, 200, JOB2, await globals.ret2.token);
      await postTry(`/job`, 200, JOB3, await globals.ret2.token);
      await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      await postTry(`/job`, 200, JOB2, await globals.ret2.token);
      await postTry(`/job`, 200, JOB3, await globals.ret2.token);
      await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      await postTry(`/job`, 200, JOB2, await globals.ret2.token);
      await postTry(`/job`, 200, JOB3, await globals.ret2.token);

      let jobs = null;

      jobs = await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token);
      expect(jobs.length).toBe(5);
      expect(jobs[0].title).toBe(JOB3.title);
      expect(jobs[1].title).toBe(JOB2.title);
      expect(jobs[2].title).toBe(JOB1.title);
      expect(jobs[3].title).toBe(JOB3.title);
      expect(jobs[4].title).toBe(JOB2.title);

      jobs = await getTry(`/job/feed?start=5`, 200, {}, await globals.ret1.token);
      expect(jobs.length).toBe(5);
      expect(jobs[0].title).toBe(JOB1.title);
      expect(jobs[1].title).toBe(JOB3.title);
      expect(jobs[2].title).toBe(JOB2.title);
      expect(jobs[3].title).toBe(JOB1.title);
      expect(jobs[4].title).toBe(JOB3.title);

      jobs = await getTry(`/job/feed?start=10`, 200, {}, await globals.ret1.token);
      expect(jobs.length).toBe(2);
      expect(jobs[0].title).toBe(JOB2.title);
      expect(jobs[1].title).toBe(JOB1.title);
    });

  });

  describe('PUT /job should', () => {
    it('fail with a bad token', async () => {
      await putTry('/job', 403, {}, INVALID_TOKEN);
    });

    it('fail without any properties', async () => {
      await putTry(`/job`, 400, { }, await globals.ret1.token);
    });

    it('fail if wrong person tries to update a job', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      
      await putTry(`/job`, 403, { id, title: 'newTitle' }, await globals.ret1.token);
    });

    it('update the relevant properties of only title is updated', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      
      await putTry(`/job`, 200, { id, title: 'newTitle' }, await globals.ret2.token);

      const jobs = (await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token)).filter(job => job.id === id);
      expect(jobs.length).toBe(1);
      const thisJob = jobs[0];

      expect(thisJob.title).toBe('newTitle');
      expect(thisJob.image).toBe(JOB1.image);
      expect(thisJob.description).toBe(JOB1.description);
      expect(thisJob.start).toBe(JOB1.start);
      expect(thisJob.likes).toEqual(expect.arrayContaining([]));
      expect(thisJob.comments).toEqual(expect.arrayContaining([]));
    });

    it('update the relevant properties of only start is updated', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      
      await putTry(`/job`, 200, { id, start: '2008-10-05T14:48:00.000Z' }, await globals.ret2.token);

      const jobs = (await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token)).filter(job => job.id === id);
      expect(jobs.length).toBe(1);
      const thisJob = jobs[0];

      expect(thisJob.title).toBe(JOB1.title);
      expect(thisJob.image).toBe(JOB1.image);
      expect(thisJob.description).toBe(JOB1.description);
      expect(thisJob.start).toBe('2008-10-05T14:48:00.000Z');
      expect(thisJob.likes).toEqual(expect.arrayContaining([]));
      expect(thisJob.comments).toEqual(expect.arrayContaining([]));
    });

    it('update the relevant properties of only description is updated', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      
      await putTry(`/job`, 200, { id, description: 'newDescription' }, await globals.ret2.token);

      const jobs = (await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token)).filter(job => job.id === id);
      expect(jobs.length).toBe(1);
      const thisJob = jobs[0];

      expect(thisJob.title).toBe(JOB1.title);
      expect(thisJob.image).toBe(JOB1.image);
      expect(thisJob.description).toBe('newDescription');
      expect(thisJob.start).toBe(JOB1.start);
      expect(thisJob.likes).toEqual(expect.arrayContaining([]));
      expect(thisJob.comments).toEqual(expect.arrayContaining([]));
    });

    it('update the relevant properties of only image is updated', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      
      await putTry(`/job`, 200, { id, image: JOB2.image }, await globals.ret2.token);

      const jobs = (await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token)).filter(job => job.id === id);
      expect(jobs.length).toBe(1);
      const thisJob = jobs[0];

      expect(thisJob.title).toBe(JOB1.title);
      expect(thisJob.image).toBe(JOB2.image);
      expect(thisJob.description).toBe(JOB1.description);
      expect(thisJob.start).toBe(JOB1.start);
      expect(thisJob.likes).toEqual(expect.arrayContaining([]));
      expect(thisJob.comments).toEqual(expect.arrayContaining([]));
    });

    it('ensure those new jobs appear on GET /job', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      
      await putTry(`/job`, 200, { id, image: JOB2.image }, await globals.ret2.token);

      const jobs = (await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token)).filter(job => job.id === id);
      expect(jobs.length).toBe(1);
      const thisJob = jobs[0];

      expect(thisJob.title).toBe(JOB1.title);
      expect(thisJob.image).toBe(JOB2.image);
      expect(thisJob.description).toBe(JOB1.description);
      expect(thisJob.start).toBe(JOB1.start);
      expect(thisJob.likes).toEqual(expect.arrayContaining([]));
      expect(thisJob.comments).toEqual(expect.arrayContaining([]));

      const userId = parseInt(globals.ret2.userId, 10);
      const userInfo = await getTry(`/user?userId=${userId}`, 200, {}, await globals.ret1.token);
      expect(userInfo.id).toBe(userId);
      expect(userInfo.email).toBe(USER2.email);
      expect(userInfo.name).toBe(USER2.name);
      expect(userInfo.password).toBe(undefined);
      expect(userInfo.image).toBe(undefined);
      expect(userInfo.watcheeUserIds).toEqual(expect.arrayContaining([]));
      expect(userInfo.jobs.length).toEqual(1);
    });
  });

  describe('DELETE /job should', () => {
    it('fail with a bad token', async () => {
      await deleteTry('/job', 403, {}, INVALID_TOKEN);
    });

    it('fail without any properties', async () => {
      await deleteTry(`/job`, 400, { }, await globals.ret1.token);
    });

    it('successfully delete a job', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret2.token);

      const jobs = await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token);
      expect(jobs.length).toBe(1);

      await deleteTry(`/job`, 200, { id, image: JOB2.image }, await globals.ret2.token);

      const jobs2 = await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token);
      expect(jobs2.length).toBe(0);
    });
  });

  describe('PUT /job/like should', () => {
    it('fail with a bad token', async () => {
      await putTry('/job/like', 403, {}, INVALID_TOKEN);
    });

    it('fail without any properties', async () => {
      await putTry(`/job/like`, 400, { }, await globals.ret1.token);
    });

    it('successfully add a like', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      await putTry(`/job/like`, 200, { id, turnon: true }, await globals.ret1.token);

      const job = (await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token)).filter(job => job.id === id)[0];
      expect(job.likes).toEqual(expect.arrayContaining([ {
        userId: globals.ret1.userId,
        userEmail: USER1.email,
        userName: USER1.name,
      }]));
    });

    it('successfully add a like twice with the same effect', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      await putTry(`/job/like`, 200, { id, turnon: true }, await globals.ret1.token);
      await putTry(`/job/like`, 200, { id, turnon: true }, await globals.ret1.token);

      const job = (await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token)).filter(job => job.id === id)[0];
      expect(job.likes).toEqual(expect.arrayContaining([ {
        userId: globals.ret1.userId,
        userEmail: USER1.email,
        userName: USER1.name,
      }]));
    });

    it('successfully like and unlike something', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      await putTry(`/job/like`, 200, { id, turnon: true }, await globals.ret1.token);
      await putTry(`/job/like`, 200, { id, turnon: false }, await globals.ret1.token);

      const job = (await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token)).filter(job => job.id === id)[0];
      expect(job.likes).toEqual(expect.arrayContaining([]));
    });

    it('successfully have two people like something', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret3.token);
      await putTry(`/job/like`, 200, { id, turnon: true }, await globals.ret1.token);
      await putTry(`/job/like`, 200, { id, turnon: true }, await globals.ret2.token);

      const job = (await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token)).filter(job => job.id === id)[0];
      expect(job.likes).toEqual(expect.arrayContaining([{
        userId: globals.ret1.userId,
        userEmail: USER1.email,
        userName: USER1.name,
      },{
        userId: globals.ret2.userId,
        userEmail: USER2.email,
        userName: USER2.name,
      }]));
    });
  });

  describe('POST /job/comment should', () => {
    it('fail with a bad token', async () => {
      await postTry('/job/comment', 403, {}, INVALID_TOKEN);
    });

    it('fail without any properties', async () => {
      await postTry(`/job/comment`, 400, { }, await globals.ret1.token);
    });

    it('successfully add a comment', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      await postTry(`/job/comment`, 200, { id, comment: 'Hello there' }, await globals.ret1.token);

      const job = (await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token)).filter(job => job.id === id)[0];
      expect(job.comments).toEqual(expect.arrayContaining([ {
        userId: globals.ret1.userId,
        userEmail: USER1.email,
        userName: USER1.name,
        comment: 'Hello there',
      }]));
    });

    it('successfully add two comments', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret2.token);
      await postTry(`/job/comment`, 200, { id, comment: 'Hello there' }, await globals.ret1.token);
      await postTry(`/job/comment`, 200, { id, comment: 'Hello there2' }, await globals.ret1.token);

      const job = (await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token)).filter(job => job.id === id)[0];
      expect(job.comments).toEqual(expect.arrayContaining([{
        userId: globals.ret1.userId,
        userEmail: USER1.email,
        userName: USER1.name,
        comment: 'Hello there',
      },{
        userId: globals.ret1.userId,
        userEmail: USER1.email,
        userName: USER1.name,
        comment: 'Hello there2',
      }]));
    });

    it('successfully add comments from two people', async () => {
      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret3.token);
      await postTry(`/job/comment`, 200, { id, comment: 'Hello there' }, await globals.ret1.token);
      await postTry(`/job/comment`, 200, { id, comment: 'Hello there2' }, await globals.ret2.token);

      const job = (await getTry(`/job/feed?start=0`, 200, {}, await globals.ret1.token)).filter(job => job.id === id)[0];
      expect(job.comments).toEqual(expect.arrayContaining([{
        userId: globals.ret1.userId,
        userEmail: USER1.email,
        userName: USER1.name,
        comment: 'Hello there',
      },{
        userId: globals.ret2.userId,
        userEmail: USER2.email,
        userName: USER2.name,
        comment: 'Hello there2',
      }]));
    });
  });

});