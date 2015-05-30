var AppFactory = require('./lib/AppFactory');
var appConfigGetter = require('./lib/AppConfig');

var appFactory = new AppFactory();

console.log('Retrieving config');

appConfigGetter()
	.then(function(config){
		console.log('Starting app with configuration');
		console.log(config);
		return appFactory.NewApp(config);
	}).then(function(app){
		console.log('App started, listening on port 8080');
		app.listen(8080);
	})
	.catch(function(err){
		console.error(err);
		console.error(err.stack);
	});