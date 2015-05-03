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
			resourceLocation += req.originalUrl;
			resourceLocation += '/'+scene.sceneID;
			resourceLocation += '/'+(scene.dateCreated.getTime().toString());

			res.append('Location',resourceLocation);

			res.send();
		}).catch(function(err){
			console.error(err);
			console.log(err.stack);
			res.status(500).send(err);
		});
	});

	router.post('/:sceneHash/:sceneDate/processes/',function (req,res) {
		var obj = req.body;

		var sceneID = {
			sceneID:req.params.sceneHash,
			dateCreated:req.params.sceneDate
		};

		sceneStore.AddProcessToScene(sceneID,obj).then(function(scene){
			var processId = scene.processes.length - 1;

			res.status(201);

			var resourceLocation = req.protocol+'://'+req.hostname;
			// resourceLocation += ':8080';
			resourceLocation += req.originalUrl;
			resourceLocation += '/'+processId;
			
			res.append('Location',resourceLocation);

			res.send();
		})
		.catch(function(err){
			console.error(err);
			// console.log(err.stack);
			res.status(500).send(err);
		});
	});

	router.put('/:sceneID/processes/:processId',function (req,res) {
		var obj = req.body;

		var requests = generatorRequests.filter(function(request){
			// For some reason `===` breaks here
			return request._id == req.params.sceneID;
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
