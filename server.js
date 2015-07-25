'use strict';

require("babel/register")(
  {
    optional: ['es7.objectRestSpread','es7.decorators']
  }
);

var Promise = require('promise');
var express = require('express');
var React = require('react');
var Router = require('react-router').Router;
var Location = require('react-router/lib/Location');
var Redux = require('redux');
var ReduxProvider = require('react-redux').Provider;

var server = express();

var app = require('./app');

function promiseMiddleware(next, onError) {
  return function (action) {
    action && typeof action.then === 'function'
      ? Promise.resolve(action).done(next, onError)
      : next(action);
  }
}

server.use(function (req, res, onError) {
  var location = new Location(req.path, req.query);
  Router.run(
    app.routes,
    location,
    function (err, initialState) {
      if (err) return onError(err);
      if (!initialState) return onError();
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
      var store = Redux.createStore(
        app.reducers,
        undefined,
        (app.middleware || []).concat([
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
        ]).map(wrapMiddleware)
      );

      var element = React.createElement(
        ReduxProvider,
        {store: store},
        function () {
          return React.createElement(
            Router,
            initialState
          );
        }
      );

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
          res.send(html);
        } else {
          running = false;
        }
      }
    }
  );
});

server.listen(3000);
