'use strict';

require("babel/register")(
  {
    optional: ['es7.objectRestSpread','es7.decorators'],
    //plugins: ['loop-detector']
  }
);

var Promise = require('promise');
var express = require('express');
var stringify = require('js-stringify');
var React = require('react');
var Router = require('react-router').Router;
var Location = require('react-router/lib/Location');
var Redux = require('redux');
var ReduxProvider = require('react-redux').Provider;
var browserify = require('browserify-middleware');

var server = express();

var app = require('./app');

function promiseMiddleware(store) {
  return function (next, onError) {
    return function (action) {
      action && typeof action.then === 'function'
        ? Promise.resolve(action).done(next, onError)
        : next(action);
    }
  }
}

function render(path, query) {
  return new Promise(function (resolve, reject) {
    var location = new Location(path, query);
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
          Redux.combineReducers(app.reducers)
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
      [
        require('babelify'),
        {
          optional: ['es7.objectRestSpread', 'es7.decorators']
        }
      ]
    ]
  }
));

server.use(function (req, res, onError) {
  render(req.path, req.query).done(function (result) {
    var html = result.html;
    var state = result.state;
    res.status(result.status).send(
      '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css" />' +
      '<div id="react-root">' + html + '</div>' +
      '<script>var INITIAL_STATE = (' + stringify(state) + ');</script>' +
      '<script src="/client.js"></script>'
    );
  }, onError);
});

server.listen(3000);
console.log('listening on port 3000');
