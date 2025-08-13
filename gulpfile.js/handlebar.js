const gulp = require( 'gulp' ),
	gulpLoadPlugins = require( 'gulp-load-plugins' ),
	plugins = gulpLoadPlugins();

const { requirePortalParam, getBaseDir, getConfig } = require( './config' );

function compileHandlebars() {

	requirePortalParam();

	return gulp.src( getConfig().hb.src )
		.pipe( plugins.compileHandlebars( getConfig().hb.templateData, getConfig().hb.options ) )
		.pipe( plugins.rename( 'index.html' ) )
		.pipe( gulp.dest( getBaseDir() ) );
}

exports.compileHandlebars = compileHandlebars;
