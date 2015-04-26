var AWS = require('aws-sdk');
var Promise = require('promise');
var hash = require('object-hash');

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

	this.db = new AWS.DynamoDB(dynamoParams);

	this.dbTable = 'skl-scenes';
}

SceneStore.prototype.SetupDb = function() {
	var self = this;
	var params = {
		TableName: self.dbTable,
		AttributeDefinitions:[
			{
				AttributeName: 'sceneID',
				AttributeType: 'S'
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
		],
		ProvisionedThroughput:{
			ReadCapacityUnits: 10,
			WriteCapacityUnits: 1
		}
	};

	return new Promise(function(resolve,reject){
		
		self.db.describeTable({ TableName: self.dbTable } , function(err, data) {
			if(err && err.code == 'ResourceNotFoundException'){
				// Table doesn't exist
				self.db.createTable(params, function(err, data) {
					if(err){
						reject(err);
					}else{
						resolve();
					}
				});
			}else if (err){
				reject(err);
			}else{
				resolve();
			}
		});
	});
};

SceneStore.prototype.Add = function(scene) {
	self = this;

	if(!scene.dateCreated){
		throw new Error('scene requires "dateCreated" property');
	}

	if(!(scene.dateCreated instanceof Date)){
		throw new Error('scene.dateCreated should be a Date');
	}

	scene.sceneID = generateSceneId(scene);
	sceneToDyno(scene);

	return new Promise(function(resolve,reject){
		var params = {
			TableName: self.dbTable,
			Item:dynoEncode(scene)
		}
		self.db.putItem(params,function(err,res){
			if(err){
				reject(err);
			}else{
				resolve(dynoToScene(scene));
			}
		});
	});
};

SceneStore.prototype.Get = function(obj) {
	var map = dynoEncode(sceneToDyno(obj));
	return new Promise(function(resolve,reject){
		var params = {
			TableName: self.dbTable,
			Key:map
		}

		self.db.getItem(params,function(err,res){
			if(err){
				reject(err);
			}else{
				var scene = dynoDecode(res.Item);
				scene = dynoToScene(scene);
				resolve(scene);
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

// Converts all scene properties to a dyno acceptable format
function sceneToDyno(scene){
	scene.dateCreated = scene.dateCreated.getTime();
	return scene;
}

// Converts a dyno formatted scene back to normal js object
function dynoToScene(scene){
	scene.dateCreated = new Date(scene.dateCreated);
	return scene;
}

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
	var id = hash.MD5(JSON.stringify(scene.resource)+scene.dateCreated);
	return id;
	// var str = JSON.stringify(scene.resource);
	// for (var i = 0; i < str.length; ++i)
	// {
	// 		idArr.push(str.charCodeAt(i));
	// }

	// var idStr = idArr.join('');
	// return parseInt(idStr);
}

module.exports = SceneStore;