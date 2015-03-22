var express = require('express');

// Create app
var app = express();

// Add routers
app.use('/scene',require('./controllers/scene-api'));

module.exports = app;