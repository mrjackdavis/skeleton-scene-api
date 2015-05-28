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
				MYSQL_CONNECTION_URL:constructMySQLURL()
			};
			resolve(config);
		}catch(e){
			reject(e);
		}
	});
}

function getEnvVar(name){
	if(!envExists(name)){
		throw new Error('Expect environment variable "'+name+'"');
	}else{
		return process.env[name];
	}
}

function envExists(name){
	return process.env[name] !== undefined;
}

function constructMySQLURL(){
	if(envExists('MYSQL_CONNECTION_URL')){
		return getEnvVar('MYSQL_CONNECTION_URL');
	}

	// Docker container linking
	if(envExists('MYSQL_PORT') && envExists('MYSQL_ENV_MYSQL_ROOT_PASSWORD')){
		// MYSQL_PORT will be in format tcp://host:port
		var splitMysqlPort = getEnvVar('MYSQL_PORT').split(':');
		var host = splitMysqlPort[1].replace('//','');
		var port = splitMysqlPort[2];
	}

	throw new Error('Unable to get MySQL connection information, try using the environment variable "MYSQL_CONNECTION_URL". Or consult the documentation for more connection options');
}

module.exports = getConfig;