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
		dateCreated:Joi.date(),
		resource:{
			type:Joi.string(),
			location:Joi.string().uri()
		},
		processes:Joi.array().items(Joi.object().keys({
			status:Joi.string()
		})),
		tags:Joi.array().required().default([],'Empty tag array')
	},
	tableName: 'skl-scenes'
});

function SceneStore(args){
	var dynamoParams = { 
		apiVersion: '2012-08-10',
		accessKeyId: 'hocus',
		secretAccessKey: 'pocus',
		region: 'ap-southeast-2',
	};

	if(args.endpoint){
		dynamoParams.endpoint = new AWS.Endpoint(args.endpoint);
	}

	vogels.dynamoDriver(new AWS.DynamoDB(dynamoParams));
}

SceneStore.prototype.SetupDb = function() {
	return new Promise(function(resolve,reject){
		Scene.createTable(function(err,data){
			if(err){
				reject(err);
			}else{
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
				
				resolve(ValidateScene(newScene.get()));
			}
		});
	});
};

SceneStore.prototype.Get = function(obj) {
	return new Promise(function(resolve,reject){
		Scene.get(obj.sceneID,obj.dateCreated,function(err,scene){
			if(err){
				reject(err);
			}else{
				resolve(ValidateScene(scene.get()));
			}
		});	
	});
};

SceneStore.prototype.GetRange = function() {
	throw new NotImplementedError();
};

SceneStore.prototype.AddProcessToScene = function(scene,newProcess) {
	throw new NotImplementedError();
};

function ValidateScene(scene){
	if(!scene.processes){
		scene.processes = [];
	}
	if(typeof scene.dateCreated === 'string'){
		scene.dateCreated = new Date(scene.dateCreated);
	}
	return scene;
}

module.exports = SceneStore;