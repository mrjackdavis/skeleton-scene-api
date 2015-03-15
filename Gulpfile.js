var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('default', function() {
	console.log('Hello world!');
});

gulp.task('test', function() {
	gulp.src('tests/**.js',{read: false})
		.pipe(mocha({reporter: 'nyan'}));
});