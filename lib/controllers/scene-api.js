var router = require('express').Router();

var generatorRequests = [];

router.get('/',function (req,res) {
	res.status(200).send(generatorRequests);
});

router.post('/',function (req,res) {
	var obj = req.body;
	obj._id = generatorRequests.length;

	obj.processes = [];

	generatorRequests.push(obj);

	res.status(201);

	var resourceLocation = req.protocol+'://'+req.hostname;
	// resourceLocation += ':8080';
	resourceLocation += req.originalUrl;
	resourceLocation += '/'+obj._id;
	
	res.append('Location',resourceLocation);

	res.send();
});

router.post('/:sceneId/processes/',function (req,res) {
	var obj = req.body;

	var items = generatorRequests.filter(function(item){
		// For some reason `===` breaks here
		return item._id == req.params.sceneId;
	});
	
	var item = items[0];

	console.log('Adding process to item '+item._id);

	item.processes.push(obj);

	// res.status(201);

	// var resourceLocation = req.protocol+'://'+req.hostname;
	// // resourceLocation += ':8080';
	// resourceLocation += req.originalUrl;
	// resourceLocation += '/'+obj._id;
	
	// res.append('Location',resourceLocation);

	res.send();
});

module.exports = router;