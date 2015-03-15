var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');

gulp.task('default', function() {
	console.log('Hello world!');
});

gulp.task('lint',function(){
	gulp.src('tests/**.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail'))
})

gulp.task('test', function() {
	gulp.src('tests/**.js',{read: false})
		.pipe(mocha({reporter: 'nyan'}));
});