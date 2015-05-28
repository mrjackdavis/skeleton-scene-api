var fs = require('fs');
var Promise = require('promise');

function getConfig(){
	return new Promise(function(resolve,reject){
		try{
			var config = {
				AWS_CREDENTIALS:{
					accessKeyId:getEnvVar('AWS_ACCESSKEYID'),
					secretAccessKey:getEnvVar('AWS_SECRETACCESSKEY')
				},
				MYSQL_CONNECTION_URL:getEnvVar('MYSQL_CONNECTION_URL')
			};
			resolve(config);
		}catch(e){
			reject(e);
		}
	});
}

function getEnvVar(name){
	if(!process.env[name]){
		throw new Error('Expect environment variable "'+name+'"');
	}else{
		return process.env[name];
	}
}

module.exports = getConfig;