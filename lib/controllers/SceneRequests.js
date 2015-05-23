var router = require('express').Router();

module.exports.Router = function(params){
	var store = params.SceneStore;

	router.post('/',function(req,res){

		var params = {
			resourceType:req.body.resourceType,
			resourceURI:req.body.resourceURI,
			generatorName:req.body.generatorName
		};

		store.NewRequest(params).then(function(scene){
			res.status(201);

			var resourceLocation = req.protocol+'://'+req.hostname;
			resourceLocation += req.originalUrl;
			resourceLocation += '/'+scene.sceneID;
			resourceLocation += '/'+scene.createdAt;

			res.append('Location',resourceLocation);

			res.send();
		}).catch(function(err){
			console.error(err);
			console.log(err.stack);
			res.status(500).send(err);
		});
	});

	router.get('/',function(req,res){

		var params = {
			resourceType:req.body.resourceType,
			resourceURI:req.body.resourceURI,
			generatorName:req.body.generatorName
		};

		store.GetRequests(params).then(function(requests){
			res.status(200).send(requests);
		}).catch(function(err){
			console.error(err);
			console.log(err.stack);
			res.status(500).send(err);
		});
	});

	router.get('/:sceneID/:createdAt',function(req,res){
		var params = {
			sceneID:req.params.sceneID,
			createdAt:parseInt(req.params.createdAt),
		};

		store.GetRequest(params).then(function(sceneRequests){
			res.status(200).send(sceneRequests);
		}).catch(function(err){
			console.error(err);
			console.log(err.stack);
			res.status(500).send(err);
		});
	});

	router.put('/:sceneID/:createdAt',function(req,res){
		var params = {
			sceneID:req.params.sceneID,
			createdAt:parseInt(req.params.createdAt)
		};

		var status = req.body.status;
		
		store.SetSceneRequestStatus(params,status)
			.then(function(){
				res.status(200).send();
			}).catch(function(err){
				console.error(err);
				console.log(err.stack);
				res.status(500).send(err);
			});
	});

	return router;
};