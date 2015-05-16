var Joi = require('joi');

var Scene = vogels.define('Scene', {
	hashKey : 'sceneID',
	rangeKey : 'completedAt',
	schema : {
		sceneID:vogels.types.uuid().required(),
		completedAt:Joi.number().required(),
		requestedAt:Joi.number().required(),
		generatorName:Joi.string().required(),
		resourceType:Joi.string().required(),
		resourceURI:Joi.string().uri().required(),
		resultType:Joi.string().required(),
		resultURI:Joi.string().uri().required(),
		tags:Joi.array().required().default([],'Empty tag array')
	},
	tableName: 'skl-scene'
});

module.exports = Scene;