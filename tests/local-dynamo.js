var Promise = require('promise');
var mkdirp = require('mkdirp');
var localDynamo = require('local-dynamo');

function MockDynamo(){
	this.filePath = './tmp/mockDynamo/';
}

MockDynamo.prototype.Start = function(port) {
	var self = this;

	return new Promise(function(resolve,reject){
		mkdirp(self.filePath,function(err){
			if(err){
				reject(err);
			}else{
				self.process = localDynamo.launch(self.filePath, port);
				resolve();
			}
		});
	});
};

MockDynamo.prototype.Stop = function(port) {
	var self = this;
	return new Promise(function(resolve,reject){
		self.process.kill('SIGHUP');
		resolve();
	});
};

module.exports = MockDynamo;