var util = require('util');

function NotImplementedError() {
  this.name = this.constructor.name;

  this.message = 'Not implemented';
}

util.inherits(NotImplementedError, Error);

module.exports = NotImplementedError;