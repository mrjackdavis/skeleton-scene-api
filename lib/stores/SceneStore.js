var AWS = require('aws-sdk');
var Promise = require('promise');
var hash = require('object-hash');
var NotImplementedError = require('../NotImplementedError');
var SceneModel = require('./SceneModel');
var SceneRequestModel = require('./SceneRequestModel');
var createTableIfNoneExists = require('../utils/createTableIfNoneExists');
var sceneEnums = require('./SceneEnums');
var statusTypes = sceneEnums.StatusTypes;
var vogels = require('vogels');
var Joi = require('joi');

var Scene = vogels.define('SceneOld', {
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
	tableName: 'skl-scenes-old'
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
	return createTableIfNoneExists(self.dynamoDB,Scene)
		.then(function(){
			return createTableIfNoneExists(self.dynamoDB,SceneRequestModel);
		}).then(function(){
			return createTableIfNoneExists(self.dynamoDB,SceneModel);
		});
};

SceneStore.prototype.NewRequest = function(params) {
	var NewRequest = {
		generatorName:params.generatorName,
		resourceType:params.resourceType,
		resourceURI:params.resourceURI,
		tags:params.tags,

		status:statusTypes.Pending,
		createdAt:Date.now()
	};

	return new Promise(function(resolve,reject){
		SceneRequestModel.create(NewRequest,function(err,createdRequest){
			if(err){
				reject(err);
			}else{
				resolve(createdRequest.get());
			}
		});
	});
};

SceneStore.prototype.GetRequest = function(params){
	return new Promise(function(resolve,reject){
		SceneRequestModel.get(params.sceneID,params.createdAt,function(err,scene){
			if(err){
				reject(err);
			}else{
				if(scene){
					resolve(scene.get());
				}else{
					resolve(null);
				}
			}
		});	
	});
};

SceneStore.prototype.SetSceneRequestStatus = function(scene,status){
	var sceneID = {
		sceneID:scene.sceneID,
		createdAt:scene.createdAt
	};

	var dynoParams = {
		UpdateExpression:'SET #currentStatus = :newStatus',
		ExpressionAttributeNames:{
			'#currentStatus':'status'
		},
		ExpressionAttributeValues:{
			':newStatus':status,
		}
	};

	return new Promise(function(resolve,reject){
		SceneRequestModel.update(sceneID,dynoParams,function(err,data){
			if(err){
				console.log('foofar');
				reject(err);
			}else{
				resolve(data.get());
			}
		});
	});
};

SceneStore.prototype.CompleteSceneRequest = function(scene,status,result){
	var sceneID = {
		sceneID:scene.sceneID,
		createdAt:scene.createdAt
	};

	var self = this;

	return self.GetRequest(sceneID)
		.then(function(requestedScene){
			var newScene = {
				sceneID:requestedScene.sceneID,
				completedAt:Date.now(),
				requestedAt:requestedScene.createdAt,
				generatorName:requestedScene.generatorName,
				resourceType:requestedScene.resourceType,
				resourceURI:requestedScene.resourceURI,
				resultType:result.type,
				resultURI:result.URI,
				tags:requestedScene.tags
			};
			return new Promise(function(resolve,reject){
				SceneModel.create(newScene,function(err,createdScene){
					if(err){
						reject(err);
					}else{
						resolve(createdScene.get());
					}
				});
			});
		}).then(function(createdScene){
			return new Promise(function(resolve,reject){
				SceneRequestModel.destroy(sceneID,function(err){
					if(err){
						reject(err);
					}else{
						resolve(createdScene);
					}
				});
			});
		});
};

SceneStore.prototype.GetScene = function(params) {
	var sceneID = params.sceneID;
	var completedAt = params.completedAt;

	return new Promise(function(resolve,reject){
		SceneModel.get(sceneID,completedAt,function(err,scene){
			if(err){
				reject(err);
			}else{
				resolve(scene.get());
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
				
				resolve(normaliseScene(newScene.get()));
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
				resolve(normaliseScene(scene.get()));
			}
		});	
	});
};

SceneStore.prototype.GetRange = function() {
	return new Promise(function(resolve,reject){
		Scene
			.scan()
			.limit(25)
			.exec(function(err,res){
				if(err){
					reject(err);
				}else{
					var scenes = res.Items.map(function(resItem){
						return normaliseScene(resItem.attrs);
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
				resolve(normaliseScene(data.get()));
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
				resolve(normaliseScene(data.get()));
			}
		});
	});
};

function normaliseScene(scene){
	if(!scene.processes){
		scene.processes = [];
	}
	if(typeof scene.dateCreated === 'string' || typeof scene.dateCreated === 'number'){
		scene.dateCreated = new Date(scene.dateCreated);
	}
	return scene;
}

module.exports = SceneStore;