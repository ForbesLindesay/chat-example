'use strict';

var express = require('express');
var passport = require('passport');
var moped = require('./moped/server');

var server = express();
server.use(function (req, res, next) {
  //req.user = {id: 'forbes', name: 'Forbes'};
  next();
});

server.use(require('cookie-session')({
  keys: [process.env.COOKIE_SECRET || 'dsfdsasfdas'],
  signed: true
}));

server.use(passport.initialize());
server.use(passport.session());

var app = moped(require.resolve('./app'), {longPoll: true});

// Handle bicycle actions on the server side
app.handleActions(require('./bicycle/server').actionTypes, require('./api'));
app.handleActions('LOG_IN', function (action, req) {
  return req.login({id: action.name.toLowerCase(), name: action.name});
});

server.use(app);

server.listen(3000);
console.log('listening on port 3000');
