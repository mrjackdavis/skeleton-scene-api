var vogels = require('vogels');
var Joi = require('joi');
var sceneEnums = require('./SceneEnums');
var statusTypes = sceneEnums.StatusTypes;
var resourceTypes = sceneEnums.ResourceTypes;

var SceneRequest = vogels.define('SceneRequest', {
	hashKey : 'sceneID',
	rangeKey : 'createdAt',
	schema : {
		sceneID:vogels.types.uuid().required(),
		createdAt:Joi.number().required(),
		generatorName:Joi.string().required(),
		resourceType:Joi.string().required().valid(resourceTypes.toArray()),
		resourceURI:Joi.string().uri().required(),
		status:Joi.string().required().valid(statusTypes.toArray()),
		tags:Joi.array().required().default([],'Empty tag array')
	},
	tableName: 'skl-scene-requests'
});

module.exports = SceneRequest;