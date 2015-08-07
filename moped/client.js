'use strict';

var Promise = require('promise');
var React = require('react');
var Router = require('react-router').Router;
var history = require('react-router/lib/BrowserHistory').history;
var Redux = require('redux');
var ReduxProvider = require('react-redux').Provider;
var request = require('then-request');
var assign = require('object.assign');
var userReducer = require('./lib/user-reducer');
var promiseMiddleware = require('./lib/promise-middleware');

var app = require(APP_PATH);

var middleware = (app.middleware || []).concat([
  promiseMiddleware,
  function (store) {
    return function (next) {
      return function (action) {
        console.log('action: ' + action.type);
        console.dir(action, {depth: 10, colors: true});
        next(action);
      };
    };
  }
]);
//HANDLED_ACTIONS
middleware.unshift(function (store) {
  return function (next) {
    return function (action) {
      next(action);
      if (HANDLED_ACTIONS[action.type] && !action.mopedFromServer) {
        // TODO: handle errors and timeouts
        next(request('POST', '/action', {json: action, qs: {session: MOPED_SESSION_KEY}}).getBody('utf8').then(JSON.parse));
      }
    }
  }
});

var store = Redux.applyMiddleware.apply(null, middleware)(Redux.createStore)(
  Redux.combineReducers(assign({}, app.reducers, {user: userReducer})),
  INITIAL_STATE
);
INITIAL_STATE = null;
window.REDUX_STORE = store;

var realTime = require(REALTIME_PATH);
if (typeof realTime === 'function') {
  realTime = {default: realTime};
}
realTime.default(store, MOPED_SESSION_KEY);

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
