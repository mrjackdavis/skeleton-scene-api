var localDynamo = require('local-dynamo');
var Promise = require('promise');
var mkdirp = require('mkdirp');
// var path = require('path');

module.exports.launch = function(dir,port) {
	return new Promise(function(resolve,reject){
		// var resolvedDir = path.resolve(dir);
		mkdirp(dir,function(err){
			if(err){
				reject(err);
			}else{
				localDynamo.launch(dir, port);
				resolve();
			}
		});
	});
};