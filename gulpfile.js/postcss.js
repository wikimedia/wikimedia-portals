const gulp = require( 'gulp' ),
	gulpLoadPlugins = require( 'gulp-load-plugins' ),
	plugins = gulpLoadPlugins(),
	postCSSNext = require( 'postcss-cssnext' ),
	postCSSImport = require( 'postcss-import' ),
	postCSSReporter = require( 'postcss-reporter' );

const browsersListConfig = require( 'browserslist-config-wikimedia' );

const { requirePortalParam, getBaseDir } = require( './config' );

function postCSS() {

	requirePortalParam();

	return gulp.src( getBaseDir() + 'assets/postcss/style.css' )
		.pipe( plugins.postcss( [
			postCSSImport(),
			postCSSNext( { browsers: browsersListConfig } )
		],
		{ map: { inline: true } }
		) )
		.pipe( gulp.dest( getBaseDir() + 'assets/css/' ) );
}

function validatePostCSS() {

	return gulp
		.src( [ 'src/**/postcss/*.css', '!src/**/postcss/_*.css' ] )
		.pipe( plugins.postcss(
			[
				postCSSImport(),
				postCSSNext( { browsers: browsersListConfig } ),
				postCSSReporter( { clearMessages: true, throwError: true } )
			], { map: { inline: true } }
		) );
}

exports.postCSS = postCSS;
exports.validatePostCSS = validatePostCSS;
