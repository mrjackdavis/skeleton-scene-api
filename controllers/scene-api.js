var router = require('express').Router();

router.get('/',function (req,res) {
	res.status(200).send({
		hello:'world'
	});
});

module.exports = router;