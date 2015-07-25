'use strict';

var Promise = require('promise');
var React = require('react');
var Router = require('react-router').Router;
var history = require('react-router/lib/BrowserHistory').history;
var Redux = require('redux');
var ReduxProvider = require('react-redux').Provider;

var app = require('./app');

function promiseMiddleware(next, onError) {
  return function (action) {
    action && typeof action.then === 'function'
      ? Promise.resolve(action).done(next, onError)
      : next(action);
  }
}

var store = Redux.createStore(
  app.reducers,
  INITIAL_STATE,
  (app.middleware || []).concat([
    promiseMiddleware,
    function (next) {
      return function (action) {
        console.log('action');
        console.dir(action, {depth: 10, colors: true});
        next(action);
      };
    }
  ])
);
INITIAL_STATE = null;

function createRoot() {
  return React.createElement(
    ReduxProvider,
    {store: store},
    function () {
      return React.createElement(
        Router,
        {children: app.routes, history}
      );
    }
  );
}
var root = app.wrap ? app.wrap(createRoot) : createRoot();

React.render(root, document.getElementById('react-root'));
