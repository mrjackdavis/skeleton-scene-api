var fs = require('fs');
var Promise = require('promise');

function getConfig(){
	return new Promise(function(resolve,reject){
		fs.readFile('./secrets.json', function (err, data) {
			if (err){
				reject(err);
			}else{
				resolve(JSON.parse(data));
			}
		});
	});
}

module.exports = getConfig;