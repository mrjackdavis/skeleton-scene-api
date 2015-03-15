var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');

var manifest = {
	js:['./tests/**.js','./*.js'],
	tests:['./tests/**.js'],
};

gulp.task('default', ['test']);

gulp.task('lint',function(){
	return gulp.src(manifest.js)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail'));
});

gulp.task('test',['lint'], function() {
	return gulp.src(manifest.tests,{read: false})
		.pipe(mocha({reporter: 'nyan'}));
});