'use strict';

module.exports = function (store) {
  return function (next) {
    return function (action) {
      console.dir(action, {depth: 10, colors: true});
      next(action);
    };
  }
};
