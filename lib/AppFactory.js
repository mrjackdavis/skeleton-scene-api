var express = require('express');
var bodyParser = require('body-parser');
var SceneStore = require('./stores/SceneStore');

var sceneRouter = require('./controllers/scene-api');
var SceneRequests = require('./controllers/SceneRequests');
var Scenes = require('./controllers/Scenes');

function AppFactory () {
	// Nothing here yet...
}

AppFactory.prototype.NewApp = function(config) {
	// Create app
	var app = express();

	// Add middleware
	app.use(bodyParser.json());

	// Add headers
	app.use(function (req, res, next) {

		// Website you wish to allow to connect
		res.setHeader('Access-Control-Allow-Origin', '*');

		// Request methods you wish to allow
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

		// Request headers you wish to allow
		res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

		// Set to true if you need the website to include cookies in the requests sent
		// to the API (e.g. in case you use sessions)
		// res.setHeader('Access-Control-Allow-Credentials', true);

		// Pass to next layer of middleware
		next();
	});
	// Add routers
	var sceneStore = new SceneStore(config);

	var params = {
		SceneStore:sceneStore
	};

	return sceneStore.SetupDb().then(function(){
			app.use('/scene',sceneRouter(params));
			app.use('/v0-2/scene-requests/',SceneRequests.Router(params));
			app.use('/v0-2/scenes/',Scenes.Router(params));

			return app;
		});
};

module.exports = AppFactory;