var AWS = require('aws-sdk');
var Promise = require('promise');
var hash = require('object-hash');
var NotImplementedError = require('../NotImplementedError');
var vogels = require('vogels');
var Joi = require('joi');

var Scene = vogels.define('Scene', {
	hashKey : 'sceneID',
	rangeKey : 'dateCreated',
	schema : {
		sceneID:vogels.types.uuid(),
		dateCreated:Joi.number(),
		resource:{
			type:Joi.string(),
			location:Joi.string().uri()
		},
		processes:Joi.array().items(Joi.object().keys({
			status:Joi.string().required(),
			// result:Joi.string().uri()
		})),
		tags:Joi.array().required().default([],'Empty tag array')
	},
	tableName: 'skl-scenes'
});

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
	var self = this;
	return new Promise(function(resolve,reject){
		self.dynamoDB.describeTable({ TableName: Scene.tableName() } , function(err, data) {
			if(err && err.code == 'ResourceNotFoundException'){
				// Table doesn't exist
				Scene.createTable(function(err,data){
					if(err){
						reject(err);
					}else{
						resolve();
					}
				});
			}else if (err){
				reject(err)
			}else{
				// Table exists
				resolve();
			}
		});
	});
};

SceneStore.prototype.Add = function(scene) {
	scene.dateCreated = (new Date()).getTime();

	return new Promise(function(resolve,reject){
		Scene.create(scene,function(err,newScene){
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
		Scene.get(obj.sceneID,obj.dateCreated.getTime(),function(err,scene){
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
		Scene
			.scan()
			.limit(100)
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
		dateCreated:scene.dateCreated.getTime(),
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
		Scene.update(params,dynoParams,function(err,data){
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
		dateCreated:scene.dateCreated.getTime(),
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
		Scene.update(params,dynoParams,function(err,data){
			if(err){
				reject(err);
			}else{
				resolve(NormaliseScene(data.get()));
			}
		});
	});
};

function NormaliseScene(scene){
	if(!scene.processes){
		scene.processes = [];
	}
	if(typeof scene.dateCreated === 'string' || typeof scene.dateCreated === 'number'){
		scene.dateCreated = new Date(scene.dateCreated);
	}
	return scene;
}

module.exports = SceneStore;