/* eslint-env node, es6 */
var gulp = require( 'gulp' ),
	gulpLoadPlugins = require( 'gulp-load-plugins' ),
	fs = require( 'fs' ),
	del = require( 'del' ),
	plugins = gulpLoadPlugins(),
	gulpSlash = require( 'gulp-slash' );

/**
 * @external Stream
 */

// Help
const { help } = require( './help' );

gulp.task( 'help', help );

/* Preliminary configuration
 =========================================================================== */

const { requirePortalParam, getBaseDir, getConfig } = require( './config' );

/* List of tasks
 =========================================================================== */

/**
 * Compile Handlebars templates into src folder.
 * Execute 'build' task if config is undefined
 *
 * @return {Stream}
 */
const { compileHandlebars } = require( './handlebar' );

gulp.task( 'compile-handlebars', compileHandlebars );

/**
 * Compile postCSS files into regular CSS and
 * output them into the CSS src folder.
 *
 * @return {Stream}
 */

const { postCSS, validatePostCSS, lintCSS } = require( './postcss' );

gulp.task( 'postcss', postCSS );

gulp.task( 'validate-postCSS', validatePostCSS );

gulp.task( 'lint-css', gulp.series( 'validate-postCSS', lintCSS ) );

const { inlineAssets, cleanProdJS, copyTranslationFiles, concatMinifyJS, minifyHTML, copyImages, createProdSymlink } = require( './prod' );

/**
 * Lint JS in src folder as well as in root folder.
 *
 * @return {Stream}
 */

const { lintJS } = require( './javascript' );

gulp.task( 'lint-js', lintJS );

const { updateStats } = require( './stats' );

gulp.task( 'update-stats', updateStats );

const { fetchMeta } = require( './meta' );

gulp.task( 'fetch-meta', fetchMeta );

/**
 * Remove existing SVG sprite before generating a new one.
 *
 * @return {Stream}
 */
function cleanSprites() {
	var conf = getConfig();
	return del( [ conf.img.sprite.outputSVGGlob ] );
}
gulp.task( 'cleanSprites', cleanSprites );

/**
 * Create SVG sprite for use as a CSS background images.
 * Combine SVG images from the assets/img/sprite_assets directory in the src folder.
 * Output the SVG sprite in the assets/img dir as sprite-*.svg, where * is a cachebusting hash.
 *
 * Also outputs a CSS file for the SVG sprite named sprite.css in the src CSS folder.
 *
 * @return {Stream}
 */
function createSvgSprite() {
	var conf = getConfig();
	return gulp.src( conf.img.sprite.assets )
		.pipe( plugins.svgSprite( {
			shape: {
				spacing: {
					padding: 1
				},
				transform: [ 'svgo' ]
			},
			mode: {
				css: {
					layout: 'vertical',
					sprite: '../' + conf.img.sprite.outputName + '.svg',
					bust: true,
					dimensions: true,
					common: conf.img.sprite.cssPrefix,
					render: {
						css: {
							dimensions: true,
							dest: '../' + conf.img.sprite.outputCSS,
							template: conf.img.sprite.template
						}
					}
				}
			},
			variables: {
				mapname: 'svg-sprite'
			}
		} ) )
		.pipe( plugins.if( '*.svg', gulp.dest( getBaseDir() + 'assets/img/' ), gulp.dest( getBaseDir() + 'assets/css/' ) ) );
}
gulp.task( 'createSvgSprite', gulp.series( 'cleanSprites', createSvgSprite ) );

gulp.task( 'svgSprite', gulp.series( 'createSvgSprite' ) );

/**
 * Create a 'urls-to-purge.txt' file at the root of the repo that
 * contains a list of URL's that must be purged from the server cache.
 * These URLs include the root portal urls for all portals and all
 * production asset URLs in this repo.
 *
 * Must be run when after all assets have been versioned, minified &
 * copied into the prod dir.
 *
 * @return {Stream}
 */
function updateURLsToPurge() {
	var UrlsToPurge = [
			'https://www.wikibooks.org/',
			'https://www.wikimedia.org/',
			'https://www.wikinews.org/',
			'https://www.wikipedia.org/',
			'https://www.wikiquote.org/',
			'https://www.wikiversity.org/',
			'https://www.wikivoyage.org/',
			'https://www.wiktionary.org/'
		],
		portalAssetDirs = 'prod/**/assets/**/*',
		purgeFile = 'prod/urls-to-purge.txt';

	function createAssetUrl( file ) {
		var domain, urlToPurge;
		domain = file.relative.split( '/' )[ 0 ];
		urlToPurge = 'https://www.' + domain + '/portal/' + file.relative;
		return urlToPurge;
	}

	function addAssetUrl( url ) {
		return UrlsToPurge.push( url );
	}

	function assetFilesStream( file ) {
		var assetUrl;
		if ( file.isDirectory() ) {
			return;
		}
		assetUrl = createAssetUrl( file );
		return addAssetUrl( assetUrl );
	}

	function writePurgeFile() {
		var fileContents = UrlsToPurge.join( '\n' );
		fs.writeFileSync( purgeFile, fileContents );
	}

	return gulp.src( portalAssetDirs, { buffer: false, read: false } )
		.pipe( gulpSlash() ) // Because windows slashes are '\' instead of '/'
		.pipe( plugins.tap( assetFilesStream ) )
		.on( 'end', function () {
			writePurgeFile();
		} );
}

/**
 * Watch for changes in src folder and compile:
 * - handlebars templates
 * - postCSS files
 * into src folder.
 */
function watch() {

	requirePortalParam();

	gulp.watch( getConfig().watch.sprites, gulp.parallel( 'svgSprite' ) );
	gulp.watch( getConfig().watch.hb, gulp.parallel( 'compile-handlebars' ) );
	gulp.watch( getConfig().watch.postcss, gulp.parallel( 'postcss' ) );

}
gulp.task( 'watch', gulp.series( 'svgSprite', 'compile-handlebars', 'postcss', watch ) );

gulp.task( 'lint', gulp.series( 'lint-js', 'lint-css' ) );

gulp.task( 'test', gulp.series( 'lint' ) );

gulp.task( 'default', gulp.series(
	'lint',
	'svgSprite',
	'compile-handlebars',
	'postcss',
	inlineAssets,
	cleanProdJS,
	concatMinifyJS,
	minifyHTML,
	copyImages,
	copyTranslationFiles,
	createProdSymlink,
	updateURLsToPurge
) );
