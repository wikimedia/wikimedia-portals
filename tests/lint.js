var gulp = require( 'gulp' ),
	jshint = require( 'gulp-jshint' ),
	jscs = require( 'gulp-jscs' );

gulp.task( 'lint', function () {
	var devFolder = 'dev/**/*.js';

	gulp.src( [ '*.js', devFolder ] )
		.pipe( jshint( '.jshintrc' ) )
		.pipe( jshint.reporter( 'default' ) )
		.pipe( jshint.reporter( 'fail' ) )
		.pipe( jscs() )
		.pipe( jscs.reporter() )
		.pipe( jscs.reporter( 'fail' ) );
} );

gulp.start( 'lint' );
