var vogels = require('vogels');
var Joi = require('joi');
var statusTypes = require('./SceneRequestStatusTypes');

var SceneRequest = vogels.define('SceneRequest', {
	hashKey : 'sceneID',
	rangeKey : 'createdAt',
	schema : {
		sceneID:vogels.types.uuid().required(),
		createdAt:Joi.number().required(),
		generatorName:Joi.string().required(),
		resourceType:Joi.string().required(),
		resourceLocation:Joi.string().uri().required(),
		status:Joi.string().required().valid(statusTypes.toArray()),
		tags:Joi.array().required().default([],'Empty tag array')
	},
	tableName: 'skl-scene-requests'
});

module.exports = SceneRequest;