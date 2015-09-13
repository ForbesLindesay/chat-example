var Promise = require('promise');

module.exports = function promiseMiddleware(store) {
  return function (next) {
    return function (action) {
      return action && typeof action.then === 'function'
        ? Promise.resolve(action).then(next)
        : next(action);
    }
  }
};
