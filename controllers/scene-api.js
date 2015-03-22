var router = require('express').Router();

var generatorRequests = [];

router.get('/',function (req,res) {
	res.status(200).send(generatorRequests);
});

router.post('/',function (req,res) {
	var obj = req.body;
	obj._id = generatorRequests.length;

	generatorRequests.push(obj);

	res.status(201);

	var resourceLocation = req.protocol+'://'+req.hostname;
	resourceLocation += ':8080';
	resourceLocation += req.originalUrl;
	resourceLocation += '/'+obj._id;
	
	res.append('Location',resourceLocation);

	res.send();
});

module.exports = router;