var router = require('express').Router();

var generatorRequests = [];

router.get('/',function (req,res) {
	res.status(200).send(generatorRequests);
});

router.post('/',function (req,res) {
	console.log(req.body);
	generatorRequests.push(req.body);
	res.status(201).send();
});

module.exports = router;