var gulp = require( 'gulp' ),
	jshint = require( 'gulp-jshint' ),
	jscs = require( 'gulp-jscs' );

gulp.task( 'lint', function () {
	var devFolder = 'dev/**/*.js';

	gulp.src( [ '*.js', devFolder ] )
		.pipe( jshint( '.jshintrc' ) )
		.pipe( jshint.reporter( 'default' ) )
		.pipe( jscs() )
		.pipe( jscs.reporter() );
} );

gulp.start( 'lint' );
