var fs = require('fs');
var Promise = require('promise');

function getConfig(){
	return new Promise(function(resolve,reject){
		var secretsPath = './secrets.json';
		if(fs.existsSync(secretsPath)){
			fs.readFile(secretsPath, function (err, data) {
				if (err){
					reject(err);
				}else{
					resolve(JSON.parse(data));
				}
			});
		}else{
			resolve({});
		}
	})
	.then(function(config){
		config.AWS_CREDENTIALS = {
			accessKeyId:process.env.AWS_ACCESSKEYID,
			secretAccessKey:process.env.AWS_SECRETACCESSKEY
		};
		return config;
	});
}

module.exports = getConfig;