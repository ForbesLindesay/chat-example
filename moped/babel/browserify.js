'use strict';

var through = require("through2");
var assign  = require("object.assign");
var path    = require("path");
var babel = require('babel-core');
var transform = require('./transform');

var browserify = module.exports = function (filename, opts) {
  return browserify.configure(opts)(filename);
};
global.TOTAL_BABEL_TIME = 0;
browserify.configure = function (opts) {
  opts = assign({}, opts);
  var extensions = opts.extensions ? babel.util.arrayify(opts.extensions) : null;

  return function (filename) {
    if (!babel.canCompile(filename, extensions)) {
      return through();
    }

    var data = "";

    var write = function (buf, enc, callback) {
      data += buf;
      callback();
    };

    var end = function (callback) {
      opts.filename = filename;
      var start = Date.now();
      try {
          this.push(transform(data, opts));
      } catch(err) {
        this.emit("error", err);
        return;
      }
      var end = Date.now();
      TOTAL_BABEL_TIME += (end - start);
      callback();
    };

    return through(write, end);
  };
};
