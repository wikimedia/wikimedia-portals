var gulp = require( 'gulp' ),
	gulpLoadPlugins = require( 'gulp-load-plugins' ),
	plugins = gulpLoadPlugins(),
	postCSSNext = require( 'postcss-cssnext' ),
	postCSSImport = require( 'postcss-import' ),
	postCSSReporter = require( 'postcss-reporter' ),
	gulpStylelint = require( 'gulp-stylelint' );

const { requirePortalParam, getBaseDir } = require( './config' );

function postCSS() {

	requirePortalParam();

	return gulp.src( [ getBaseDir() + 'assets/postcss/*.css' ] )
		.pipe( plugins.postcss( [
			postCSSImport(),
			postCSSNext( { browsers: [ 'last 5 versions', 'ie 6-8', 'Firefox >= 3.5', 'iOS >= 4', 'Android >= 2.3' ] } )
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
				postCSSNext( { browsers: [ 'last 5 versions', 'ie 6-8', 'Firefox >= 3.5', 'iOS >= 4', 'Android >= 2.3' ] } ),
				postCSSReporter( { clearMessages: true, throwError: true } )
			], { map: { inline: true } }
		) );
}

function lintCSS() {

	return gulp
		.src( 'src/**/postcss/*.css' )
		.pipe( gulpStylelint( {
			reporters: [
				{ formatter: 'string', console: true }
			]
		} ) );
}

exports.postCSS = postCSS;
exports.validatePostCSS = validatePostCSS;
exports.lintCSS = lintCSS;
