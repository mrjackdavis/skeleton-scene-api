var express = require('express');
var bodyParser = require('body-parser');

// Create app
var app = express();

// Add middleware
app.use(bodyParser.json());

// Add routers
app.use('/scene',require('./controllers/scene-api'));

module.exports = app;