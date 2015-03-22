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

	// Add routers
	app.use('/scene',require('./controllers/scene-api'));

	return app;
};

module.exports = AppFactory;