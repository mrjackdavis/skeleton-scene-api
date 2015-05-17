var router = require('express').Router();
var SceneStore = require('../stores/SceneStore');

module.exports = function(params){

	var sceneStore = params.SceneStore;

	router.get('/',function (req,res) {
		sceneStore.GetRange()
			.then(function(items){
				var scenes = items.map(function(scene){
					scene.dateCreated = scene.dateCreated.getTime();
					return scene;
				});
				res.status(200).send(scenes);
			})
			.catch(function(err){
				res.status(500).send(err);
			});
	});

	router.get('/:sceneHash/:sceneDate/',function (req,res) {

		var sceneID = {
			sceneID:req.params.sceneHash,
			dateCreated:new Date(parseInt(req.params.sceneDate))
		};

		sceneStore.Get(sceneID)
			.then(function(scene){
				scene.dateCreated = scene.dateCreated.getTime();
				res.status(200).send(scene);
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
			dateCreated:new Date(parseInt(req.params.sceneDate))
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

	router.put('/:sceneHash/:sceneDate/processes/:processID',function (req,res) {
		var obj = req.body;

		if(obj.status === 'COMPLETE' && !obj.result){
			res.status(400).send({message:'`Complete` processes require `result` to be set'});
			return;
		}

		var sceneID = {
			sceneID:req.params.sceneHash,
			dateCreated:new Date(parseInt(req.params.sceneDate))
		};
		sceneStore.UpdateProcess(sceneID,req.params.processID,obj).then(function(scene){
			res.status(201);

			var resourceLocation = req.protocol+'://'+req.hostname;
			// resourceLocation += ':8080';
			resourceLocation += req.originalUrl;
			resourceLocation += '/'+req.params.processID;
			
			res.append('Location',resourceLocation);

			res.send();
		})
		.catch(function(err){
			console.error(err);
			// console.log(err.stack);
			res.status(500).send(err);
		});
	});

	return router;
};