'use strict';

var sessionDestructionHandlers = [];
var sessions = {};

function noop() {}

exports.clientPath = require.resolve('./polling-client.js');

exports.createSession = createSession;
function createSession(sessionKey) {
  var timeout = setTimeout(destroy, 600000);
  function destroy() {
    delete sessions[sessionKey];
    sessionDestructionHandlers.forEach(function (handler) {
      handler(sessionKey);
    });
  }
  function resetTimeout() {
    clearTimeout(timeout);
    timeout = setTimeout(destroy, 600000);
  }
  sessions[sessionKey] = {
    queue: [],
    trigger: noop,
    resetTimeout: resetTimeout
  };
};

exports.send = send;
function send(sessionKey, value) {
  if (sessions[sessionKey]) {
    sessions[sessionKey].queue.push(value);
    sessions[sessionKey].trigger();
  }
};

exports.onSessionDestroyed = onSessionDestroyed;
function onSessionDestroyed(fn) {
  sessionDestructionHandlers.push(fn);
};

exports._getQueue = function (sessionKey) {
  if (sessions[sessionKey]) {
    sessions[sessionKey].resetTimeout();
    var queue = sessions[sessionKey].queue;
    sessions[sessionKey].queue = [];
    return queue;
  }
};
exports._setCallback = function (sessionKey, fn) {
  if (sessions[sessionKey]) {
    var called = false;
    sessions[sessionKey].trigger = function () {
      if (called) return;
      called = true;
      fn();
    };
  }
};
