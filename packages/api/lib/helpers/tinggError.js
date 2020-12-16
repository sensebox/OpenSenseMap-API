'use strict';

// taken from https://stackoverflow.com/a/35966534
const { inherits } = require('util');

const TinggError = function TinggError (message, data) {
  Error.captureStackTrace(this, TinggError);
  this.name = TinggError.name;
  this.data = data;
  this.message = message;
};

inherits(TinggError, Error);

module.exports = TinggError;
