var gulp = require( 'gulp' ),
	jshint = require( 'gulp-jshint' ),
	jscs = require( 'gulp-jscs' ),
	stylelint = require( 'gulp-stylelint' );

gulp.task( 'lint-js', function () {
	var devFolder = 'dev/**/*.js';

	gulp.src( [ '*.js', devFolder ] )
		.pipe( jshint( '.jshintrc' ) )
		.pipe( jshint.reporter( 'default' ) )
		.pipe( jshint.reporter( 'fail' ) )
		.pipe( jscs() )
		.pipe( jscs.reporter() )
		.pipe( jscs.reporter( 'fail' ) );
} );

gulp.task( 'lint-css', function lintCssTask() {
	return gulp
		.src( 'dev/**/postcss/*.css' )
		.pipe( stylelint( {
			reporters: [
				{ formatter: 'string', console: true }
			]
		} ) );
} );

gulp.task ( 'lint', [ 'lint-js', 'lint-css' ] );

gulp.start( 'lint' );