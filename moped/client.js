'use strict';

var Promise = require('promise');
var React = require('react');
var Router = require('react-router').Router;
var createHistory = require('history/lib/createBrowserHistory');
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
        return request(
          'POST',
          '/action',
          {
            json: action,
            qs: {
              session: MOPED_SESSION_KEY
            },
            headers: {
              'x-csrf-token': MOPED_CSRF_TOKEN
            }
          }
        ).getBody('utf8').then(JSON.parse).then(null, function (err) {
          return [{
            type: 'REQUEST_FAILED',
            ...action.onError,
            error: err
          }];
        }).then(function (results) {
          results.forEach(function (result) {
            next(result);
          });
        });
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

function createRoot() {
  return React.createElement(
    ReduxProvider,
    {store: store},
    function () {
      return React.createElement(
        Router,
        {children: app.routes, history: createHistory()}
      );
    }
  );
}
var root = app.wrap ? app.wrap(createRoot) : createRoot();

React.render(root, document.getElementById('react-root'));
