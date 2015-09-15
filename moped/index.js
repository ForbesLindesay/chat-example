'use strict';


var crytpo = require('crypto');
var Promise = require('promise');
var express = require('express');
var stringify = require('js-stringify');
var React = require('react');
var RoutingContext  = require('react-router').RoutingContext;
var match = require('react-router').match;
var createLocation = require('history/lib/createLocation');
var Redux = require('redux');
var ReduxProvider = require('react-redux').Provider;
var browserify = require('browserify-middleware');
var body = require('body-parser');
var stream = require('barrage');
var assign = require('object.assign');
var reduxWait = require('redux-wait');
var promiseMiddleware = require('./lib/promise-middleware');
var loggingMiddleware = require('./lib/logging-middleware');
var userReducer = require('./lib/user-reducer');
var CLIENT_PATH = require.resolve('./client.js');


var babel = require("./babel")(
  {
    optional: [
      'es7.objectRestSpread',
      'es7.decorators'
    ],
    plugins: [
      require('../../react-jade-babel')
    ]
  }
);

module.exports = function initialize(APP_PATH, options) {
  var app = babel(APP_PATH);

  var server = express();
  server.loadModule = babel;
  var handledActions = {};
  var actionHandlers = {};
  server.handleActions = function (actions, options, handler) {
    if (typeof options === 'function') {
      handler = options;
      options = {};
    }
    if (typeof actions === 'string') {
      actions = [actions];
    }
    actions = actions || [];
    for (var i = 0; i < actions.length; i++) {
      if (actions[i] in handledActions) {
        throw new Error('You have attempted to handle ' + actions[i] + ' multiple times!');
      } else {
        handledActions[actions[i]] = options;
        actionHandlers[actions[i]] = function (action, req) {
          var results = [];
          function next(a) {
            if (a === action) return;
            results.push(a);
          }
          return Promise.resolve(handler(req)(next)(action)).then(function () {
            return results;
          });
        };
      }
    }
  };
  server.handleActions('LOG_OUT', function (action, req) {
    return req.logout();
  });
  function processServerAction(session, action, req) {
    var done = false;
    var loginUser;
    function login(user) {
      if (done) {
        throw new Error('To login from the server, you must return the value');
      }
      return loginUser = {type: 'MOPED_LOG_IN', user: loginUser};
    }
    var logoutUser;
    function logout(user) {
      if (done) {
        throw new Error('To logout from the server, you must return the value');
      }
      return logoutUser = {type: 'MOPED_LOG_OUT'};
    }
    return Promise.resolve(actionHandlers[action.type](action, {
      user: req.user,
      session: req.session,
      login: login,
      logout: logout
    })).then(function (results) {
      done = true;
      if (loginUser) {
        if (!results.some(function (r) { return r === loginUser; })) {
          throw new Error('To login from the server, you must actually dispatch the action');
        }
        if (typeof req.login !== 'function') {
          throw new Error('Server does not support req.login, you might want to install passport');
        }
        return new Promise(function (resolve) { req.login(loginUser, resolve); }).then(function () {
          return results;
        });
      }
      if (logoutUser) {
        if (!results.some(function (r) { return r === logoutUser; })) {
          throw new Error('To logout from the server, you must actually dispatch the action');
        }
        if (typeof req.logout !== 'function') {
          throw new Error('Server does not support req.logout, you might want to install passport');
        }
        return new Promise(function (resolve) { req.logout(resolve); }).then(function () {
          return results;
        });
      }
      return results;
    });
  }
  function render(req, mopedSessionKey) {
    return new Promise(function (resolve, reject) {
      var location = createLocation (req.url);
      var statusCode = 200;
      match(
        {routes: app.routes, location: location},
        function (err, redirectLocation, renderProps) {
          if (err) return reject(err);
          if (redirectLocation) return resolve({redirect: redirectLocation.pathname + redirectLocation.search});
          else if (renderProps == null) return reject();
          var middleware = (app.middleware || []).concat([
            promiseMiddleware,
            //loggingMiddleware
          ]);
          middleware.unshift(function (store) {
            return function (next) {
              return function (action) {
                next(action);
                if (actionHandlers[action.type] && !action.mopedFromServer) {
                  return processServerAction(mopedSessionKey, action, req).then(function (results) {
                    results.forEach(function (result) {
                      next(JSON.parse(JSON.stringify(result)));
                    });
                  });
                }
              }
            }
          });
          middleware.unshift(function (store) {
            return function (next) {
              return function (action) {
                if (action.type === 'SET_STATUS_CODE') {
                  if (statusCode !== action.statusCode) {
                    statusCode = action.statusCode;
                    next(action);
                  }
                } else if (action.type === 'FALLBACK_TO_SERVER') {
                  return reject();
                } else {
                  next(action);
                }
              }
            }
          });
          var store = reduxWait.apply(null, middleware)(Redux.createStore)(
            Redux.combineReducers(assign({}, app.reducers, {user: userReducer})),
            {user: req.user}
          );
          function getElement() {
            return React.createElement(
              ReduxProvider,
              {store: store},
              function () {
                return React.createElement(
                  RoutingContext,
                  renderProps
                );
              }
            );
          }
          var element = app.wrap ? app.wrap(getElement) : getElement();

          store.renderToString(
            React,
            element
          ).done(function (html) {
            resolve({html: html, state: store.getState(), status: statusCode});
          }, reject);
        }
      );
    });
  }

  server.get('/client.js', browserify(
    __dirname + '/client.js', {
      transform: [
        function (filename) {
          if (filename === CLIENT_PATH) {
            return new stream.BufferTransform(function (src) {
              return (
                src.replace(
                  /APP_PATH/g,
                  stringify(APP_PATH)
                )
              );
            }, 'utf8');
          }
          return new stream.PassThrough();
        },
        babel.browserify
      ]
    }
  ));

  server.post('/action', body.json(), function (req, res, next) {
    var action = req.body;
    var session = req.query.session;
    if (actionHandlers[action.type] && !action.mopedFromServer) {
      console.dir(action, {depth: 10, colors: true});
      processServerAction(
        session,
        action,
        req
      ).done(function (response) {
        console.dir(response, {depth: 10, colors: true});
        res.json(response);
      }, next);
    } else {
      next();
    }
  });
  server.use(function (req, res, onError) {
    if (req.method !== 'GET') return onError();
    var mopedSessionKey = crytpo.randomBytes(16).toString('hex');
    render(req, mopedSessionKey).done(function (result) {
      if (result.redirect) return res.redirect(result.redirect);
      var html = '<div id="react-root">' + result.html + '</div>';
      var state = result.state;
      var script = (
        '<script>' +
        'var INITIAL_STATE = (' + stringify(state) + ');' +
        'var HANDLED_ACTIONS = (' + stringify(handledActions) + ');' +
        'var MOPED_SESSION_KEY = (' + stringify(mopedSessionKey) + ');' +
        'var MOPED_LONG_POLL = (' + stringify((options && options.longPoll) ? true : false) + ');' +
        'var MOPED_POLL_DELAY = (' + stringify((options && options.pollDelay) ? options.pollDelay : 10000) + ');' +
        'var MOPED_CSRF_TOKEN = (' + stringify((res.locals && res.locals._csrf) || '') + ');' +
        //'INITIAL_STATE = {};' +
        '</script>' +
        '<script src="/client.js"></script>'
      );
      res.status(result.status).send(
        options && options.layout ?
        options.layout({markup: html, script: script}) :
        html + script
      );
    }, onError);
  });

  return server;
}
