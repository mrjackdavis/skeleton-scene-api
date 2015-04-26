var Promise = require('promise');
var mkdirp = require('mkdirp');
// var localDynamo = require('local-dynamo');
var dynalite = require('dynalite');

function MockDynamo(filePath){
	this.filePath = filePath || './tmp/mockDynamo';
}

MockDynamo.prototype.Start = function(port) {
	var self = this;

	return new Promise(function(resolve,reject){
		mkdirp(self.filePath,function(err){
			if(err){
				reject(err);
			}else{
				self.server = dynalite({path: self.filePath, createTableMs: 0});
				self.server.listen(port, function(err) {
					if(err){
						reject(err);
					}else{
						resolve();
					}
				});
			}
		});
	});
};

MockDynamo.prototype.Stop = function(port) {
	var self = this;
	return new Promise(function(resolve,reject){
		self.server.close(function(err){
			if(err){
				reject(err);
			}else{

				resolve();
			}
		});
	});
};

module.exports = MockDynamo;