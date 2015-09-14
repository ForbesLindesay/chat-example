'use strict';

import fs from 'fs';
import assert from 'assert';
import Promise from 'promise';
import github from 'github-basic';
import { camelizeKeys } from 'humps';
import createApi from '../bicycle/src/server.js';

var API_TOKEN;
try {
  API_TOKEN = fs.readFileSync(__dirname + '/../api-token.txt', 'utf8').trim();
} catch (ex) {}

const client = github({version: 3, auth: API_TOKEN});
const api = createApi({
  User: {
    _id: 'id'
  },
  Repo: {
    _id: 'id'
  }
});

var starredRepos = [];
function withIsStarred(repo) {
  return {
    ...repo,
    isStarred: starredRepos.indexOf(repo.fullName) !== -1
  };
}
api.read('/users/:username', 'User', function (ctx, params) {
  return client.get('/users/:username', {username: params.username}).then(camelizeKeys);
});
api.read('/users/:username/starred', ['Repo'], function (ctx, params, paging) {
  var req;
  if (paging.currentToken) {
    req = client.get(paging.currentToken, {});
  } else {
    req = client.get(
      '/users/:username/starred',
      {username: params.username}
    );
  }
  return req.then(function (result) {
    if (result.urlNext) paging.setNextToken(result.urlNext);
    return camelizeKeys(result).map(withIsStarred);
  });
});
api.read('/repos/:owner/:repo', 'User', function (ctx, params) {
  return client.get(
    '/repos/:owner/:repo',
    {owner: params.owner, repo: params.repo}
  ).then(camelizeKeys).then(withIsStarred);
});
api.read('/repos/:owner/:repo/stargazers', ['Repo'], function (ctx, params, paging) {
  var req;
  if (paging.currentToken) {
    req = client.get(paging.currentToken, {});
  } else {
    req = client.get(
      '/repos/:owner/:repo/stargazers',
      {owner: params.owner, repo: params.repo}
    );
  }
  return req.then(function (result) {
    if (result.urlNext) paging.setNextToken(result.urlNext);
    return camelizeKeys(result);
  });
});

export default api;
