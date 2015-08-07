var Promise = require('promise');

module.exports = function promiseMiddleware(store) {
  return function (next, onError) {
    return function (action) {
      action && typeof action.then === 'function'
        ? Promise.resolve(action).done(next, onError)
        : next(action);
    }
  }
};
