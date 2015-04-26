var router = require('express').Router();
var SceneStore = require('../stores/SceneStore');

var generatorRequests = [];

module.exports = function(config){

	var sceneStore = new SceneStore(config);

	router.get('/',function (req,res) {
		sceneStore.GetRange()
			.then(function(items){
				res.status(200).send(items);
			})
			.catch(function(err){
				res.status(500).send(err);
			});
	});

	router.post('/',function (req,res) {
		var obj = req.body;

		obj.dateCreated = new Date();

		obj.processes = [];

		sceneStore.Add(obj).then(function(scene){
			res.status(201);

			var resourceLocation = req.protocol+'://'+req.hostname;
			// resourceLocation += ':8080';
			resourceLocation += req.originalUrl;
			resourceLocation += '/'+scene._id;
			
			res.append('Location',resourceLocation);

			res.send();
		}).catch(function(err){
			console.log(err);
			// console.log(err.stack);
			res.status(500).send(err);
		});
	});

	router.post('/:sceneId/processes/',function (req,res) {
		var obj = req.body;

		var items = generatorRequests.filter(function(item){
			// For some reason `===` breaks here
			return item._id == req.params.sceneId;
		});
		
		var item = items[0];

		item.processes.push(obj);
		var processId = item.processes.length - 1;

		res.status(201);

		var resourceLocation = req.protocol+'://'+req.hostname;
		// resourceLocation += ':8080';
		resourceLocation += req.originalUrl;
		resourceLocation += '/'+processId;
		
		res.append('Location',resourceLocation);

		res.send();
	});

	router.put('/:sceneId/processes/:processId',function (req,res) {
		var obj = req.body;

		var requests = generatorRequests.filter(function(request){
			// For some reason `===` breaks here
			return request._id == req.params.sceneId;
		});
		
		var request = requests[0];
		var requestProcess = request.processes[req.params.processId];

		if(obj.status === 'Complete' && !obj.result){
			res.status(400);
			res.send({message:'`Complete` processes require `result` to be set'});
			return;
		}else{
			requestProcess.status = obj.status;
			requestProcess.result = obj.result;

			res.send();
		}

	});

	return sceneStore.SetupDb().then(function(){
		return router;
	});

}
