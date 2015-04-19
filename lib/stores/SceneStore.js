var AWS = require('aws-sdk');
var Promise = require('promise');

function SceneStore(args){

	this.db = new AWS.DynamoDB({
		apiVersion: '2012-08-10',
		accessKeyId: args.accessKeyId,
		secretAccessKey: args.secretAccessKey,
		region: 'ap-southeast-2',
	});

	this.dbTable = 'skl-scenes';
}

SceneStore.prototype.Add = function(scene) {
	self = this;
	return new Promise(function(resolve,reject){
		scene.sceneID = generateSceneId(scene);
		
		// delete scene.processes

		var params = {
			TableName: self.dbTable,
			Item:dynoMap(scene)
		}

		// delete scene.resource

		console.log(params);
		self.db.putItem(params,function(err,res){
			if(err){
				reject(err);
			}else{
				console.log(res);
				resolve(scene);
			}
		});
	});
};

function dynoMap(item){
	var dynoObj = {};

	for (var key in item) {
		if (item.hasOwnProperty(key)) {
			var prop = item[key];
			dynoObj[key] = dynoMapProp(prop);
		}
	}
	return dynoObj;
}

function dynoMapProp(prop){
	var type = typeof prop;

	switch(type){
		case 'number':
			return {N:prop.toString()};
		case 'string':
			return {S:prop};
		case 'object':
			if(Array.isArray(prop)){
				var arr = [];
				for (var i = prop.length - 1; i >= 0; i--) {
					arr[i] = dynoMapProp(prop[i]);
				};
				return {L:arr};
			}else{
				return {M:dynoMap(prop)};
			}
		break;
		default:
			throw new Error('Unexpected type "'+type+'"');
	}
}

function generateSceneId(scene){
	var idArr = [];

	idArr.push(scene.dateCreated);

	var str = JSON.stringify(scene.resource);
	for (var i = 0; i < str.length; ++i)
	{
	    idArr.push(str.charCodeAt(i));
	}

	var idStr = idArr.join('');
	return parseInt(idStr);
}

module.exports = SceneStore;