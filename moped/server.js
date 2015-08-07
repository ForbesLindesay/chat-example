'use strict';

require("babel/register")(
  {
    optional: ['es7.objectRestSpread','es7.decorators']
  }
);

var crytpo = require('crypto');
var Promise = require('promise');
var express = require('express');
var stringify = require('js-stringify');
var React = require('react');
var Router = require('react-router').Router;
var Location = require('react-router/lib/Location');
var Redux = require('redux');
var ReduxProvider = require('react-redux').Provider;
var browserify = require('browserify-middleware');
var body = require('body-parser');
var stream = require('barrage');
var assign = require('object.assign');
var promiseMiddleware = require('./lib/promise-middleware');
var userReducer = require('./lib/user-reducer');
var pollingRealTime = require('./real-time/polling.js');
var CLIENT_PATH = require.resolve('./client.js');
var EMPTY_REAL_TIME_CLIENT_PATH = require.resolve('./real-time/empty-client.js');

module.exports = function initialize(APP_PATH, options) {
  var app = require(APP_PATH);
  
  var realTime;
  if (options && options.realTime) {
    realTime = options.realTime;
  } else if (!options || options.realTime !== false) {
    realTime = pollingRealTime;
  }

  var server = express();
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
        actionHandlers[actions[i]] = handler;
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
      return loginUser = user;
    }
    var logoutUser;
    function logout(user) {
      if (done) {
        throw new Error('To logout from the server, you must return the value');
      }
      return logoutUser = {};
    }
    return Promise.resolve(actionHandlers[action.type](action, {
      user: req.user,
      session: req.session,
      login: login,
      logout: logout
    })).then(function (observable) {
      done = true;
      if (loginUser) {
        if (loginUser !== observable) {
          throw new Error('To login from the server, you must return the value');
        }
        if (typeof req.login !== 'function') {
          throw new Error('Server does not support req.login, you might want to install passport');
        }
        return new Promise(function (resolve) { req.login(loginUser, resolve); }).then(function () {
          return {type: 'MOPED_LOG_IN', user: loginUser};
        });
      }
      if (logoutUser) {
        if (logoutUser !== observable) {
          throw new Error('To login from the server, you must return the value');
        }
        if (typeof req.logout !== 'function') {
          throw new Error('Server does not support req.logout, you might want to install passport');
        }
        return new Promise(function (resolve) { req.logout(resolve); }).then(function () {
          return {type: 'MOPED_LOG_OUT'};
        });
      }
      if (observable && typeof observable.subscribe === 'function') {
        var subscription = subscribe(observable, session);
        return {type: 'SUBSCRIBED', source: action, subscription: subscription};
      } else {
        return observable;
      }
    });
  }

  var subscriptions = {};
  var subscriptionID = 0;
  if (realTime) {
    realTime.onSessionDestroyed(function (sessionKey) {
      var s = subscriptions[sessionKey];
      if (s) {
        Object.keys(s).forEach(function (id) {
          s[id]();
        });
        delete subscriptions[sessionKey];
      }
    });
  }
  function subscribe(observable, sessionKey) {
    if (realTime && subscriptions[sessionKey]) {
      var id = (subscriptionID++) + (Math.random().toString().substr(2, 5));
      subscriptions[sessionKey][id] = observable.subscribe(function (action) {
        realTime.send(sessionKey, action);
      });
      return [sessionKey, id];
    }
  }
  function render(req, mopedSessionKey) {
    if (realTime) {
      subscriptions[mopedSessionKey] = {};
      realTime.createSession(mopedSessionKey);
    }
    return new Promise(function (resolve, reject) {
      var location = new Location(req.path, req.query);
      var statusCode = 200;
      Router.run(
        app.routes,
        location,
        function (err, initialState) {
          if (err) return reject(err);
          if (!initialState) return reject();
          var pending = 0, dirty = true, running = false;
          function wrapMiddleware(middleware) {
            var err = new TypeError('middleware is not a function');
            return function (store) {
              var middlwareWithStore = middleware(store);
              if (typeof middleware !== 'function') {
                throw err;
              }
              return function (next) {
                var sync = false;
                var syncCount = 0;
                var middlewareWithNext = middlwareWithStore(function (action) {
                  if (sync) {
                    syncCount++;
                  } else {
                    pending--;
                  }
                  next(action);
                }, reject);
                return function (action) {
                  sync = true;
                  syncCount = 0;
                  var count = middlewareWithNext(action);
                  if (typeof count !== 'number') {
                    count = 1;
                  }
                  pending += count;
                  sync = false;
                  pending -= Math.min(syncCount, count);
                };
              };
            };
          }
          var middleware = (app.middleware || []).concat([
            promiseMiddleware,
            function (store) {
              return function (next) {
                return function (action) {
                  console.dir(action, {depth: 10, colors: true});
                  dirty = true;
                  next(action);
                  if (!running) {
                    running = true;
                    run();
                  }
                };
              }
            }
          ]).map(wrapMiddleware);
          middleware.unshift(function (store) {
            return function (next) {
              return function (action) {
                next(action);
                if (actionHandlers[action.type] && !action.mopedFromServer) {
                  next(
                    processServerAction(mopedSessionKey, action, req)
                  );
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
          var store = Redux.applyMiddleware.apply(null, middleware)(Redux.createStore)(
            Redux.combineReducers(assign({}, app.reducers, {user: userReducer})),
            {user: req.user}
          );
          function getElement() {
            return React.createElement(
              ReduxProvider,
              {store: store},
              function () {
                return React.createElement(
                  Router,
                  initialState
                );
              }
            );
          }
          var element = app.wrap ? app.wrap(getElement) : getElement();

          var html;
          if (!running) {
            running = true;
            run();
          }
          function run() {
            if (dirty && pending === 0) {
              dirty = false;
              html = React.renderToString(
                element
              );
              run();
            } else if (pending === 0) {
              resolve({html: html, state: store.getState(), status: statusCode});
            } else {
              running = false;
            }
          }
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
                ).replace(
                  /REALTIME_PATH/g,
                  stringify(realTime ? (realTime.clientPath || EMPTY_REAL_TIME_CLIENT_PATH) : EMPTY_REAL_TIME_CLIENT_PATH)
                )
              );
            }, 'utf8');
          }
          return new stream.PassThrough();
        },
        [
          require('babelify'),
          {
            optional: ['es7.objectRestSpread', 'es7.decorators']
          }
        ]
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
  server.post('/poll', function (req, res, next) {
    var session = req.query.session;
    if (realTime && realTime._getQueue) {
      var queue = realTime._getQueue(session);
      if (!queue) return next();
      res.json(queue.map(function (item) {
        item.mopedFromServer = true;
        return item;
      }));
    }
  });
  server.post('/long-poll', function (req, res, next) {
    var session = req.query.session;
    if (realTime && realTime._getQueue) {
      var queue = realTime._getQueue(session);
      if (!queue) return next();
      queue.forEach(function (item) {
        item.mopedFromServer = true;
      });
      if (queue.length || !realTime._setCallback) {
        res.json(queue);
      } else {
        var called = false;
        function callback() {
          if (called) return;
          called = true;
          res.json(realTime._getQueue(session).map(function (item) {
            item.mopedFromServer = true;
            return item;
          }));
        }
        setTimeout(callback, 20000);
        realTime._setCallback(session, callback);
      }
    }
  });
  server.use(function (req, res, onError) {
    if (req.method !== 'GET') return onError();
    var mopedSessionKey = crytpo.randomBytes(16).toString('hex');
    render(req, mopedSessionKey).done(function (result) {
      var html = result.html;
      var state = result.state;
      res.status(result.status).send(
        '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css" />' +
        '<div id="react-root">' + html + '</div>' +
        '<script>' +
        'var INITIAL_STATE = (' + stringify(state) + ');' +
        'var HANDLED_ACTIONS = (' + stringify(handledActions) + ');' +
        'var MOPED_SESSION_KEY = (' + stringify(mopedSessionKey) + ');' +
        'var MOPED_LONG_POLL = (' + stringify((options && options.longPoll) ? true : false) + ');' +
        'var MOPED_POLL_DELAY = (' + stringify((options && options.pollDelay) ? options.pollDelay : 10000) + ');' +
        //'INITIAL_STATE = {};' +
        '</script>' +
        '<script src="/client.js"></script>'
      );
    }, onError);
  });

  return server;
}
