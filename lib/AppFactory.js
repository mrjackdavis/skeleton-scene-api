var express = require('express');
var bodyParser = require('body-parser');

function AppFactory () {
	// Nothing here yet...
}

AppFactory.prototype.NewApp = function() {
	// Create app
	var app = express();

	// Add middleware
	app.use(bodyParser.json());

	// Add headers
	app.use(function (req, res, next) {

		// Website you wish to allow to connect
		res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');

		// Request methods you wish to allow
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

		// Request headers you wish to allow
		res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

		// Set to true if you need the website to include cookies in the requests sent
		// to the API (e.g. in case you use sessions)
		res.setHeader('Access-Control-Allow-Credentials', true);

		// Pass to next layer of middleware
		next();
	});

	// Add routers
	app.use('/scene',require('./controllers/scene-api')());

	return app;
};

module.exports = AppFactory;