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
		]
	}
};

module.exports = StatusTypes;