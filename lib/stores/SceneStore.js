var AWS = require('aws-sdk');
var Promise = require('promise');
var hash = require('object-hash');
var NotImplementedError = require('../NotImplementedError');
var SceneModel = require('./SceneModel');
var SceneRequestModel = require('./SceneRequestModel');
var modelUtils = require('../utils/modelUtils');
var sceneEnums = require('./SceneEnums');
var statusTypes = sceneEnums.StatusTypes;
var vogels = require('vogels');
var Joi = require('joi');


var Sequelize = require('sequelize');
var sequelize = new Sequelize('mysql://root:password@dockervm:49153/test_db');

var User = sequelize.define('User', {
  username: Sequelize.STRING,
  birthday: Sequelize.DATE
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
	return modelUtils.CreateTable(self.dynamoDB,SceneRequestModel)
		.then(function(){
			return modelUtils.CreateTable(self.dynamoDB,SceneModel);
		}).then(function(){
			return sequelize.sync({logging: false});
		}).then(function(){return;});
};

SceneStore.prototype.TeardownDb = function() {
	var self = this;
	return modelUtils.DestroyTable(self.dynamoDB,SceneRequestModel)
		.then(function(){
			return modelUtils.DestroyTable(self.dynamoDB,SceneModel);
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
				tags:requestedScene.tags,
				thumbnailURI:result.thumbnailURI
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
				resolve(normaliseScene(scene.get()));
			}
		});	
	});
};

SceneStore.prototype.GetScenes = function() {
	return new Promise(function(resolve,reject){
		SceneModel
			.scan()
			.limit(25)
			.exec(function(err,res){
				if(err){
					reject(err);
				}else{
					var scenes = res.Items.map(function(resItem){
						return normaliseScene(resItem.get());
					});
					resolve(scenes);
				}
			});
	});
};

SceneStore.prototype.GetRequests = function() {
	return new Promise(function(resolve,reject){
		SceneRequestModel
			.scan()
			.limit(25)
			.exec(function(err,res){
				if(err){
					reject(err);
				}else{
					var scenes = res.Items.map(function(resItem){
						return resItem.get();
					});
					resolve(scenes);
				}
			});
	});
};

function normaliseScene(scene){
	var normalisedObj = scene;

	if(!normalisedObj.thumbnailURI){
		normalisedObj.thumbnailURI = '';
	}

	return normalisedObj;
}

module.exports = SceneStore;