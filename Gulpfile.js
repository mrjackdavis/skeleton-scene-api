var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var del = require('del');
var istanbul = require('gulp-istanbul');

var manifest = {
	js:['./tests/**/*.js','./lib/**/*.js','./*.js'],
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

gulp.task('test',['lint','clean'], function(cb) {


	gulp.src(manifest.js)
		.pipe(istanbul()) // Covering files 
		.pipe(istanbul.hookRequire()) // Force `require` to return covered files 
		.on('finish', function () {
			gulp.src(manifest.tests,{read: false})
				.pipe(mocha())
				.pipe(istanbul.writeReports()) // Creating the reports after tests runned 
				// .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } })) // Enforce a coverage of at least 90% 
				.on('end', cb);
		});
});