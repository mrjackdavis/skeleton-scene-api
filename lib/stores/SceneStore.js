var AWS = require('aws-sdk');
var Promise = require('promise');

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

	this.db = new AWS.DynamoDB(dynamoParams);

	this.dbTable = 'skl-scenes';
}

SceneStore.prototype.SetupDb = function() {
	console.log('setting up db');
	var self = this;
	var params = {
		TableName: self.dbTable,
		AttributeDefinitions:[
			{
				AttributeName: 'sceneID',
				AttributeType: 'N'
			},
			{
				AttributeName: 'dateCreated',
				AttributeType: 'N'
			},
		],
		KeySchema: [
			{
				AttributeName: 'sceneID',
				KeyType: 'HASH'
			},
			{
				AttributeName: 'dateCreated',
				KeyType: 'RANGE'
			}
		]
	};

	return new Promise(function(resolve,reject){
		self.db.createTable(params, function(err, data) {
			if(err){
				reject(err);
			}else{
				resolve(data);
			}
		});
	});
};

SceneStore.prototype.Add = function(scene) {
	self = this;
	return new Promise(function(resolve,reject){
		scene.sceneID = generateSceneId(scene);
		
		// delete scene.processes

		var params = {
			TableName: self.dbTable,
			Item:dynoEncode(scene)
		}

		self.db.putItem(params,function(err,res){
			if(err){
				reject(err);
			}else{
				resolve(scene);
			}
		});
	});
};

SceneStore.prototype.Get = function(obj) {
	var map = dynoEncode(obj);
	return new Promise(function(resolve,reject){
		var params = {
			TableName: self.dbTable,
			Key:map
		}

		self.db.getItem(params,function(err,res){
			if(err){
				reject(err);
			}else{
				resolve(dynoDecode(res.Item));
			}
		});
	});
};

SceneStore.prototype.GetRange = function() {
	var self = this;
	return new Promise(function(resolve,reject){
		var params = {
			TableName: self.dbTable,
			Limit:100
		}

		self.db.scan(params,function(err,res){
			if(err){
				reject(err);
			}else{
				var arr = [];
				for (var i = res.Items.length - 1; i >= 0; i--) {
					arr.push(dynoDecode(res.Items[i]));
				};
				resolve(arr);
			}
		});
	});
};

function dynoEncode(item){
	var dynoObj = {};

	for (var key in item) {
		if (item.hasOwnProperty(key)) {
			var prop = item[key];
			dynoObj[key] = dynoEncodeProp(prop);
		}
	}
	return dynoObj;
}

function dynoEncodeProp(prop){
	var type = typeof prop;

	switch(type){
		case 'number':
			return {N:prop.toString()};
		case 'string':
			return {S:prop};
		case 'object':
			if(Array.isArray(prop)){
				var arr = [];
				for (var i = prop.length - 1; i >= 0; i--) {
					arr[i] = dynoEncodeProp(prop[i]);
				};
				return {L:arr};
			}else{
				return {M:dynoEncode(prop)};
			}
		break;
		default:
			throw new Error('Unexpected type "'+type+'"');
	}
}

function dynoDecode(dynoObj){
	var normObj = {};

	for (var key in dynoObj) {
		if (dynoObj.hasOwnProperty(key)) {
			var prop = dynoObj[key];
			normObj[key] = dynoDecodeProp(prop);
		}
	}

	return normObj;
}

function dynoDecodeProp(dynoObj){
	// Make sure there's only one property
	if(Object.keys(dynoObj).length !== 1){
		throw new Error('Expected one property from DynamoDB value, but got '+Object.keys(obj).length);
	}

	for (var key in dynoObj) {
		if (dynoObj.hasOwnProperty(key)) {
			var dynoProp = dynoObj[key];
			
			switch(key){
				case 'N':
					return parseInt(dynoProp);

				case 'S':
					return dynoProp;

				case 'L':
					var arr = [];
					for (var i = dynoProp.length - 1; i >= 0; i--) {
						arr.push(dynoDecodeProp(dynoProp[i]));
					};
					return arr;

				case 'M':
					return dynoDecode(dynoProp);

				default:
					throw new Error('Unexpected dynamo type "'+key+'"');
			}
		}
	}
}

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