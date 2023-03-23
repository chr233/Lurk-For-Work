import fs from 'fs';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';

import { InputError, AccessError, } from './error';
import { BACKEND_PORT } from '../../frontend/src/config';
import swaggerDocument from '../swagger.json';
import {
  save,
  getUserIdFromAuthorization,
  login,
  register,
  getUserIdFromEmail,
  assertValidUserId,
  assertValidJobPost,
  assertCreatorOfJobPost,
  assertWatcherOfJobPost,
  getUser,
  watchUser,
  updateProfile,
  getJobs,
  postJob,
  updateJobPost,
  commentOnJobPost,
  likeJobPost,
  deleteJobPost,
} from './service';

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true, }));
app.use(express.json({ limit: '50mb', }));

const catchErrors = fn => async (req, res) => {
  try {
    await fn(req, res);
    save();
  } catch (err) {
    if (err instanceof InputError) {
      res.status(400).send({ error: err.message, });
    } else if (err instanceof AccessError) {
      res.status(403).send({ error: err.message, });
    } else {
      console.log(err);
      res.status(500).send({ error: 'A system error ocurred', });
    }
  }
};

/***************************************************************
                         Auth Functions
***************************************************************/

const authed = fn => async (req, res) => {
  const userId = getUserIdFromAuthorization(req.header('Authorization'));
  await fn(req, res, userId);
};

app.post('/auth/login', catchErrors(async (req, res) => {
  const { email, password, } = req.body;
  return res.json(await login(email, password));
}));

app.post('/auth/register', catchErrors(async (req, res) => {
  const { email, password, name, } = req.body;
  return res.json(await register(email, password, name));
}));

/***************************************************************
                        Job Functions
***************************************************************/

app.get('/job/feed', catchErrors(authed(async (req, res, authUserId) => {
  const { start, } = req.query;
  return res.json(await getJobs(authUserId, parseInt(start, 10)));
})));

app.post('/job', catchErrors(authed(async (req, res, authUserId) => {
  const { image, title, start, description } = req.body;
  return res.json({
    id: await postJob(authUserId, image, title, start, description),
  });
})));

app.put('/job', catchErrors(authed(async (req, res, authUserId) => {
  const { id, image, title, start, description } = req.body;
  await assertValidJobPost(id);
  await assertCreatorOfJobPost(authUserId, id);
  await updateJobPost(authUserId, id, image, title, start, description);
  return res.status(200).send({});
})));

app.delete('/job', catchErrors(authed(async (req, res, authUserId) => {
  const { id, } = req.body;
  await assertValidJobPost(id);
  await assertCreatorOfJobPost(authUserId, id);
  await deleteJobPost(authUserId, id);
  return res.status(200).send({});
})));

app.post('/job/comment', catchErrors(authed(async (req, res, authUserId) => {
  const { id, comment, } = req.body;
  await assertValidJobPost(id);
  await assertWatcherOfJobPost(authUserId, id);
  await commentOnJobPost(authUserId, id, comment);
  return res.status(200).send({});
})));

app.put('/job/like', catchErrors(authed(async (req, res, authUserId) => {
  const { id, turnon } = req.body;
  await assertValidJobPost(id);
  await assertWatcherOfJobPost(authUserId, id);
  await likeJobPost(authUserId, id, turnon);
  return res.status(200).send({});
})));



/***************************************************************
                        User Functions
***************************************************************/

app.get('/user', catchErrors(authed(async (req, res, authUserId) => {
  const { userId, } = req.query;
  await assertValidUserId(userId);
  return res.json(await getUser(userId));
})));

app.put('/user/watch', catchErrors(authed(async (req, res, authUserId) => {
  const { email, id, turnon } = req.body;
  let userId = id;
  if (id === undefined) {
    userId = getUserIdFromEmail(email);
  }
  await assertValidUserId(userId);
  await watchUser(authUserId, userId, turnon);
  return res.status(200).send({});
})));

app.put('/user', catchErrors(authed(async (req, res, authUserId) => {
  const { email, password, name, image } = req.body;
  await updateProfile(authUserId, email, password, name, image);
  return res.status(200).send({});
})));

/***************************************************************
                       Running Server
***************************************************************/

app.get('/', (req, res) => res.redirect('/docs'));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


const port = BACKEND_PORT || 5000;

const server = app.listen(port, () => {
  console.log(`Backend is now listening on port ${port}!`);
  console.log(`For API docs, navigate to http://localhost:${port}`);
});

export default server;
