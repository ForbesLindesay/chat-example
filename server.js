'use strict';

require("babel/register")(
  {
    optional: ['es7.objectRestSpread','es7.decorators']
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

function promiseMiddleware(next, onError) {
  return function (action) {
    action && typeof action.then === 'function'
      ? Promise.resolve(action).done(next, onError)
      : next(action);
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
          return function (next) {
            var sync = false;
            var syncCount = 0;
            middleware = middleware(function (action) {
              if (sync) {
                syncCount++;
              } else {
                pending--;
              }
              next(action);
            });
            return function (action) {
              sync = true;
              syncCount = 0;
              var count = middleware(action);
              if (typeof count !== 'number') {
                count = 1;
              }
              pending += count;
              sync = false;
              pending -= syncCount;
            };
          };
        }
        var middleware = (app.middleware || []).concat([
          promiseMiddleware,
          function (next) {
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
        ]).map(wrapMiddleware);
        middleware.unshift(function (next) {
          return function (action) {
            if (action.type === 'SET_STATUS_CODE') {
              statusCode = action.statusCode;
            } else if (action.type === 'FALLBACK_TO_SERVER') {
              return reject();
            } else {
              next(action);
            }
          }
        });
        var store = Redux.createStore(
          app.reducers,
          undefined,
          middleware
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
