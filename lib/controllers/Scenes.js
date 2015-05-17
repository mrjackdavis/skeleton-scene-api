var router = require('express').Router();

module.exports.Router = function(params){
	var store = params.SceneStore;

	router.post('/',function(req,res){

		var scene = {
			sceneID:req.body.request.sceneID,
			createdAt:parseInt(req.body.request.createdAt)
		};
		var status = 'SUCCESSFUL';
		var result = req.body.result;

		store.CompleteSceneRequest(scene,status,result)
			.then(function(scene){
				res.status(201);

				var resourceLocation = req.protocol+'://'+req.hostname;
				resourceLocation += req.originalUrl;
				resourceLocation += '/'+scene.sceneID;
				resourceLocation += '/'+scene.completedAt;

				res.append('Location',resourceLocation);

				res.send();

			}).catch(function(err){
				console.log(err);
				console.log(err.stack);
				res.status(500).send(err);
			});
	});


	router.get('/',function(req,res){
		store.GetScenes()
			.then(function(scenes){
				res.send(scenes);
			})
			.catch(function(){
				console.log(err);
				console.log(err.stack);
				res.status(500).send(err);
			});
	});

	return router;
};