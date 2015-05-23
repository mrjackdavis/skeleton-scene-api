module.exports.CreateTable = function CreateTable(DynamoDb,Model){
	return new Promise(function(resolve,reject){
		DynamoDb.describeTable({ TableName: Model.tableName() } , function(err, data) {
			if(err && err.code === 'ResourceNotFoundException'){
				// Table doesn't exist
				Model.createTable(function(err,data){
					if(err){
						reject(err);
					}else{
						resolve();
					}
				});
			}else if (err){
				reject(err);
			}else{
				// Table exists
				resolve();
			}
		});
	});
};


module.exports.DestroyTable = function DestroyTable(DynamoDb,Model){
	return new Promise(function(resolve,reject){
		DynamoDb.describeTable({ TableName: Model.tableName() } , function(err, data) {
			if(err && err.code === 'ResourceNotFoundException'){
				// Table doesn't exist
				resolve();
			}else if (err){
				reject(err);
			}else{
				// Table exists
				DynamoDb.deleteTable({ TableName: Model.tableName() }, function(err, data){
					if(err){
						reject(err);
					}else{
						resolve();
					}
				});
			}
		});
	});
};