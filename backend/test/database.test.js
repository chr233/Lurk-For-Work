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

describe('Resetting database', () => {

  beforeEach(async () => {
    reset();    
  });

  beforeAll(() => {
    server.close();
  });

  describe('Resetting database', () => {
    it('Resetting database', async () => {
      const globals = {};

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

      const { id } = await postTry(`/job`, 200, JOB1, await globals.ret1.token);
    });

  });

});