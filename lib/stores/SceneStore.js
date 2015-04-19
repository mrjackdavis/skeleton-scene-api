var dyno = require('dyno');
var Promise = require('promise');

function SceneStore(args){
	this.db = dyno({
		accessKeyId: args.accessKeyId,
		secretAccessKey: args.secretAccessKey,
		region: 'ap-southeast-2',
		table: 'skl-scenes'
	});
}

SceneStore.prototype.Add = function(scene) {
	self = this;
	return new Promise(function(resolve,reject){
		scene.sceneID = generateSceneId(scene);

		delete scene.resource
		delete scene.processes

		console.log(scene);
		self.db.putItem(scene,function(err,res){
			if(err){
				reject(err);
			}else{
				console.log(res);
				resolve(scene);
			}
		});
	});
};

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