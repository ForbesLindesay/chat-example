'use strict';

import assert from 'assert';
import Promise from 'promise';
import github from 'github-basic';
import { camelizeKeys } from 'humps';
import createApi from '../bicycle/src/server.js';

const client = github({version: 3});
const api = createApi({
  User: {
    _id: 'id'
  },
  Repo: {
    _id: 'id'
  }
});

api.read('/users/:username', 'User', function (ctx, params) {
  return client.get('/users/:username', {username: params.username}).then(camelizeKeys);
});
api.read('/users/:username/starred', ['Repo'], function (ctx, params) {
  return client.get('/users/:username/starred', {username: params.username}).then(camelizeKeys);
});

export default api;
