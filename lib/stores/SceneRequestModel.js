var vogels = require('vogels');
var Joi = require('joi');
var sceneEnums = require('./SceneEnums');
var statusTypes = sceneEnums.StatusTypes;
var resourceTypes = sceneEnums.ResourceTypes;

var SceneRequest = vogels.define('SceneRequest', {
	hashKey : 'sceneID',
	rangeKey : 'createdAt',
	timestamps : true,
	schema : {
		sceneID:vogels.types.uuid().required(),
		generatorName:Joi.string().required(),
		resourceType:Joi.string().required().valid(resourceTypes.toArray()),
		resourceURI:Joi.string().uri().required(),
		status:Joi.string().required().valid(statusTypes.toArray()),
		tags:Joi.array().required().default([],'Empty tag array')
	},
	tableName: 'skl-scene-requests'
});

module.exports = SceneRequest;