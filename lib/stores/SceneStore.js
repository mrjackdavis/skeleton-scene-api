var ddb = require('dynamodb');

function SceneStore(args){
	this.db = ddb.ddb(args);
}

module.exports = SceneStore;