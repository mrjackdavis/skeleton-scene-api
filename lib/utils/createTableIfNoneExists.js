module.exports = function CreateTableIfNoneExists(DynamoDb,Model){
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