var AWS = require('aws-sdk');
var Promise = require('promise');
var hash = require('object-hash');
var NotImplementedError = require('../NotImplementedError');
var SceneModel = require('./SceneModel');
var SceneRequestModel = require('./SceneRequestModel');
var createTableIfNoneExists = require('../utils/createTableIfNoneExists');

function SceneStore(args){
	var dynamoParams = { 
		apiVersion: '2012-08-10',
		accessKeyId: args.AWS_CREDENTIALS.accessKeyId,
		secretAccessKey: args.AWS_CREDENTIALS.secretAccessKey,
		region: 'ap-southeast-2',
	};

	if(args.endpoint){
		dynamoParams.endpoint = new AWS.Endpoint(args.endpoint);
	}
	var dynamoDB = new AWS.DynamoDB(dynamoParams);
	this.dynamoDB = dynamoDB;
	vogels.dynamoDriver(dynamoDB);
}

SceneStore.prototype.SetupDb = function() {
	return createTableIfNoneExists(this.dynamoDB,SceneModel)
		.then(function(){
			return createTableIfNoneExists(this.dynamoDB,SceneRequestModel);
		});
};

SceneStore.prototype.Add = function(scene) {
	scene.createdAt = Date.now();

	return new Promise(function(resolve,reject){
		SceneModel.create(scene,function(err,newScene){
			if(err){
				reject(err);
			}else{
				
				resolve(NormaliseScene(newScene.get()));
			}
		});
	});
};

SceneStore.prototype.Get = function(obj) {
	return new Promise(function(resolve,reject){
		SceneModel.get(obj.sceneID,obj.createdAt,function(err,scene){
			if(err){
				reject(err);
			}else{
				resolve(NormaliseScene(scene.get()));
			}
		});	
	});
};

SceneStore.prototype.GetRange = function() {
	return new Promise(function(resolve,reject){
		SceneModel
			.scan()
			.limit(25)
			.exec(function(err,res){
				if(err){
					reject(err)
				}else{
					var scenes = res.Items.map(function(resItem){
						return NormaliseScene(resItem.attrs);
					});
					resolve(scenes);
				}
			});
	});
};

SceneStore.prototype.AddProcessToScene = function(scene,newProcess) {
	var params = {
		sceneID:scene.sceneID,
		createdAt:scene.createdAt.getTime(),
	};

	var dynoParams = {
		UpdateExpression:'SET #prcss = list_append(if_not_exists(#prcss,:emptyList),:newProcess)',
		ExpressionAttributeNames:{
			'#prcss':'processes'
		},
		ExpressionAttributeValues:{
			':newProcess':[newProcess],
			':emptyList':[]
		}
	};

	return new Promise(function(resolve,reject){
		SceneModel.update(params,dynoParams,function(err,data){
			if(err){
				reject(err);
			}else{
				resolve(NormaliseScene(data.get()));
			}
		});
	});
};

SceneStore.prototype.UpdateProcess = function(scene,processIndex,processUpdate) {
	var params = {
		sceneID:scene.sceneID,
		createdAt:scene.createdAt,
	};

	var dynoParams = {
		UpdateExpression:'SET #prcss['+processIndex+'] = :newProcess',
		ExpressionAttributeNames:{
			'#prcss':'processes'
		},
		ExpressionAttributeValues:{
			':newProcess':processUpdate
		}
	};

	return new Promise(function(resolve,reject){
		SceneModel.update(params,dynoParams,function(err,data){
			if(err){
				reject(err);
			}else{
				resolve(NormaliseScene(data.get()));
			}
		});
	});
};

module.exports = SceneStore;