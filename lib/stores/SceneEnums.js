var StatusTypes = {
	Pending:'PENDING',
	InProgress:'IN_PROGRESS',
	Successful:'SUCCESSFUL',
	Failed:'FAILED',
	Stale:'STALE',
	toArray:function toArray(){
		return [
			StatusTypes.Pending,
			StatusTypes.InProgress,
			StatusTypes.Successful,
			StatusTypes.Failed,
			StatusTypes.Stale,
		];
	}
};

var ResourceTypes = {
	Url:'URL',
	toArray:function toArray(){
		return [
			ResourceTypes.Url
		];
	}
};

module.exports.StatusTypes = StatusTypes;
module.exports.ResourceTypes = ResourceTypes;