var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var del = require('del');

var manifest = {
	js:['./tests/**.js','./lib/**.js','./*.js'],
	tests:['./tests/**.js'],
};

gulp.task('default', ['test']);

gulp.task('clean',function(cb){
	del('./tmp/**',cb);
});

gulp.task('lint',function(){
	return gulp.src(manifest.js)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail'));
});

gulp.task('test',['lint','clean'], function() {
	return gulp.src(manifest.tests,{read: false})
		.pipe(mocha());
});