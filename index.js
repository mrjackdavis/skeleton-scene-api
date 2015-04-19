var AppFactory = require('./lib/AppFactory');
var appConfigGetter = require('./lib/AppConfig');

var appFactory = new AppFactory();

console.log('Preparing app');

appConfigGetter().then(function(config){
	var app = appFactory.NewApp({
		AWS_CREDENTIALS:config.AWS_CREDENTIALS
	});

	console.log('App started, listening on port 8080');
	app.listen(8080);
	
}).catch(function(err){
	console.error(err);
	console.error(err.stack);
});