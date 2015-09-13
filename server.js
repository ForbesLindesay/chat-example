'use strict';

var moped = require('./moped');
var BICYCLE_REQUEST = require('./bicycle/src/actions').BICYCLE_REQUEST;
var createMiddleware = require('./bicycle/src/middleware');
var api = require('./src/api');

var app = moped(require.resolve('./src'));

app.handleActions(BICYCLE_REQUEST, createMiddleware(api, function () { return {}; }));

app.listen(3000);
