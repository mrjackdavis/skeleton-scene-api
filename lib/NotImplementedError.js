var util = require('util');

function NotImplementedError(detail) {
  this.name = this.constructor.name;

  if(detail){
  	this.message = detail+' is not implemented';
  }else{
	  this.message = 'Not implemented';
  }
}

util.inherits(NotImplementedError, Error);

module.exports = NotImplementedError;