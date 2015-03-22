var AppFactory = require('./lib/AppFactory');

var appFactory = new AppFactory();

var app = appFactory.NewApp();

console.log('App started, listening on port 8080');
app.listen(8080);