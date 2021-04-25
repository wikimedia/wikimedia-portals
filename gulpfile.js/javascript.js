var gulp = require( 'gulp' ),
	gulpLoadPlugins = require( 'gulp-load-plugins' ),
	plugins = gulpLoadPlugins(),
	argv = require( 'yargs' ).argv,
	portalParam = argv.portal;

function lintJS() {
	var srcFolder = 'src/**/*.js';
	if ( portalParam ) {
		// Only run on this portal files.
		srcFolder = 'src/' + portalParam + '/**/*.js';
	}
	return gulp.src( [ 'gulpfile.js/*js', '*.js', srcFolder ] )
		.pipe( plugins.eslint7() )
		.pipe( plugins.eslint7.format() )
		.pipe( plugins.eslint7.failAfterError() );
}

exports.lintJS = lintJS;
