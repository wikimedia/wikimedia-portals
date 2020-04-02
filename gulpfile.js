/* eslint-env node, es6 */
var gulp = require( 'gulp' ),
	gulpLoadPlugins = require( 'gulp-load-plugins' ),
	argv = require( 'yargs' ).argv,
	siteStats = require( './data/site-stats' ),
	fs = require( 'fs' ),
	postCSSNext = require( 'postcss-cssnext' ),
	postCSSImport = require( 'postcss-import' ),
	postCSSReporter = require( 'postcss-reporter' ),
	gulpStylelint = require( 'gulp-stylelint' ),
	del = require( 'del' ),
	plugins = gulpLoadPlugins(),
	gulpSlash = require( 'gulp-slash' ),
	replace = require( 'gulp-replace' ),
	execFile = require( 'child_process' ).execFile,
	pngquant = require( 'pngquant-bin' ),
	vinylPaths = require( 'vinyl-paths' ),
	preq = require( 'preq' ),
	portalParam = argv.portal,
	getBaseDir, getProdDir, getConfig;

// Help
gulp.task( 'help', function () {
	console.log();
	console.log( '+-------------------------------------------------------------------------------------------------+' );
	console.log( '|                                     =====  USAGE =====                                          |' );
	console.log( '+-------------------------------------------------------------------------------------------------+' );
	console.log( '| GLOBAL TASKS :                                                                                  |' );
	console.log( '|                                                                                                 |' );
	console.log( '| gulp lint                                   - run jslint on all JS files                        |' );
	console.log( '| gulp update-stats                           - update file containing projects stats             |' );
	console.log( '+-------------------------------------------------------------------------------------------------+' );
	console.log( '| PORTAL-SPECIFIC TASKS :                                                                         |' );
	console.log( '|                                                                                                 |' );
	console.log( '| gulp lint --portal wikipedia.org            - run jslint on JS files on portal JS files         |' );
	console.log( '| gulp watch --portal wikipedia.org           - watches dev directory and generates an index.html |' );
	console.log( '|                                               file in it without inlined/minified assets        |' );
	console.log( '| gulp --portal wikipedia.org                 - run all of the above on the specified portal page |' );
	console.log( '|                                                                                                 |' );
	console.log( '| gulp fetch-meta --portal wikipedia.org      - overwrite the portal page with source from Meta   |' );
	console.log( '+-------------------------------------------------------------------------------------------------+' );
	console.log();
} );

/* Preliminary configuration
 =========================================================================== */

/**
 * Preliminary task for tasks that require the portal param.
 * Also sets config for remaining tasks.
 */
function requirePortalParam() {
	if ( !portalParam ) {
		console.log( '\x1b[31m' );
		console.log( 'Error: please specify the portal you wish to build.' );
		console.log( 'Type gulp help for more information.' );
		console.log( '\x1b[0m' );
		process.exit( 1 );
	}
}

getBaseDir = function () {
	requirePortalParam();

	getBaseDir = function () {
		return 'dev/' + portalParam + '/';
	};
	return getBaseDir();
};

getProdDir = function () {
	requirePortalParam();

	getProdDir = function () {
		return 'prod/' + portalParam + '/';
	};
	return getProdDir();
};

getConfig = function () {
	var config = {},
		baseDir, prodDir;

	baseDir = getBaseDir();
	prodDir = getProdDir();

	config.hb = {
		src: baseDir + 'index.handlebars',
		templateData: require( './' + baseDir + 'controller.js' ),
		options: {
			batch: [ './' + baseDir + '/templates' ],
			helpers: require( './hbs-helpers.global' )
		}
	};

	config.htmlmin = {
		src: prodDir + 'index.html',
		dest: prodDir + 'index.html',
		options: {
			preventAttributesEscaping: true,
			collapseWhitespace: true,
			preserveLineBreaks: true,
			collapseBooleanAttributes: false
		}
	};

	config.watch = {
		sprites: [ baseDir + 'assets/img/sprite_assets/**/*' ],
		postcss: baseDir + 'assets/postcss/*.css',
		hb: [ baseDir + '*.handlebars',
			baseDir + '.json',
			baseDir + 'controller.js',
			baseDir + 'templates/**/*'
		]
	};

	config.img = {
		src: [ baseDir + 'assets/img/*', '!' + baseDir + 'assets/img/sprite_assets' ],
		dest: prodDir + 'assets/img',
		sprite: {
			cssPrefix: 'sprite',
			assets: baseDir + 'assets/img/sprite_assets/*.svg',
			outputName: 'sprite',
			outputCSS: 'sprite.css',
			outputCSSPath: baseDir + 'assets/css/sprite.css',
			outputSVGGlob: baseDir + 'assets/img/sprite*.svg',
			outputPNGGlob: baseDir + 'assets/img/sprite*.png',
			template: baseDir + 'assets/css/sprite-template.mustache'
		}
	};

	getConfig = function () {
		return config;
	};
	return getConfig();
};

/* List of tasks
 =========================================================================== */

/**
 * Compile Handlebars templates into dev folder.
 * Execute 'build' task if config is undefined
 *
 * @return {Stream}
 */
function compileHandlebars() {

	requirePortalParam();

	return gulp.src( getConfig().hb.src )
		.pipe( plugins.compileHandlebars( getConfig().hb.templateData, getConfig().hb.options ) )
		.pipe( plugins.rename( 'index.html' ) )
		.pipe( gulp.dest( getBaseDir() ) );
}
gulp.task( 'compile-handlebars', compileHandlebars );

/**
 * Compile postCSS files into regular CSS and
 * output them into the CSS dev folder.
 *
 * @return {Stream}
 */
function postCSS() {

	requirePortalParam();

	return gulp.src( [ getBaseDir() + 'assets/postcss/*.css', '!' + getBaseDir() + 'assets/postcss/_*.css' ] )
		.pipe( plugins.postcss( [
			postCSSImport(),
			postCSSNext( { browsers: [ 'last 5 versions', 'ie 6-8', 'Firefox >= 3.5', 'iOS >= 4', 'Android >= 2.3' ] } )
		],
		{ map: { inline: true } }
		) )
		.pipe( gulp.dest( getBaseDir() + 'assets/css/' ) );
}
gulp.task( 'postcss', postCSS );

/**
 * Inline assets of index.html in dev folder
 * and move index.html into prod folder
 *
 * @return {Stream}
 */
function inlineAssets() {

	requirePortalParam();

	return gulp.src( getBaseDir() + 'index.html' )
		.pipe( plugins.inline( {
			css: plugins.cssnano.bind( this, {
				discardComments: {
					removeAll: true
				}
			} ),
			disabledTypes: [ 'svg', 'img', 'js' ]
		} ) )
		.pipe( gulp.dest( getProdDir() ) );
}

/**
 * Clean `assets/js/` folder from the prod folder.
 *
 * @return {Stream}
 */
function cleanProdJS() {

	return del( [ getProdDir() + '/assets/js' ] );
}

function copyTranslationFiles() {

	requirePortalParam();

	del( getProdDir() + '/assets/l10n/**/*.json' );

	return gulp.src( getBaseDir() + '/assets/l10n/**/*.json' )
		.pipe( gulp.dest( getProdDir() + '/assets/l10n/' ) );
}

/**
 * Concatenate JS files into a single file and minify it.
 *
 * @return {Stream}
 */
function concatMinifyJS() {

	requirePortalParam();

	return gulp.src( getConfig().htmlmin.src )
		.pipe( plugins.useref( {
			searchPath: getBaseDir(),
			transformTargetPath: function ( filePath ) {
				/**
				 * Rewrite concatenated file path to include symlink
				 * necessary for production apache config.
				 */
				return `portal/${portalParam}/${filePath}`;
			}
		} ) )
		.pipe( plugins.if( '*.js', plugins.uglify() ) )
		.pipe( plugins.if( '*.js', plugins.rev() ) )
		.pipe( plugins.revReplace() )
		.pipe( gulp.dest( getProdDir() ) )
		.pipe( plugins.rev.manifest() )
		.pipe( gulp.dest( getBaseDir() + 'assets' ) );
}

/**
 * Minify index.html file in prod folder,
 * depends on inlineAssets which moves index.html from dev to prod.
 *
 * @return {Stream}
 */
function minifyHTML() {

	requirePortalParam();

	return gulp.src( getConfig().htmlmin.src )
		.pipe( plugins.htmlmin( getConfig().htmlmin.options ) )
		.pipe( gulp.dest( getProdDir() ) );
}

/**
 * Lint JS in dev folder as well as in root folder.
 *
 * @return {Stream}
 */
function lintJS() {
	var devFolder = 'dev/**/*.js';
	if ( portalParam ) {
		// Only run on this portal files.
		devFolder = 'dev/' + portalParam + '/**/*.js';
	}
	return gulp.src( [ '*.js', devFolder ] )
		.pipe( plugins.eslint() )
		.pipe( plugins.eslint.format() )
		.pipe( plugins.eslint.failAfterError() );
}
gulp.task( 'lint-js', lintJS );

function validatePostCSS() {

	return gulp
		.src( [ 'dev/**/postcss/*.css', '!dev/**/postcss/_*.css' ] )
		.pipe( plugins.postcss(
			[
				postCSSImport(),
				postCSSNext( { browsers: [ 'last 5 versions', 'ie 6-8', 'Firefox >= 3.5', 'iOS >= 4', 'Android >= 2.3' ] } ),
				postCSSReporter( { clearMessages: true, throwError: true } )
			], { map: { inline: true } }
		) );
}
gulp.task( 'validate-postCSS', validatePostCSS );

function lintCSS() {

	return gulp
		.src( 'dev/**/postcss/*.css' )
		.pipe( gulpStylelint( {
			reporters: [
				{ formatter: 'string', console: true }
			]
		} ) );
}
gulp.task( 'lint-css', gulp.series( 'validate-postCSS', lintCSS ) );

function updateStats() {

	return siteStats.getSiteStats().then( function ( stats ) {
		fs.writeFileSync( './data/site-stats.json', JSON.stringify( stats, null, '\t' ) );
	} );
}
gulp.task( 'update-stats', updateStats );

function fetchMeta() {

	var portalsFromMeta,
		portalRequest,
		portalRequests = [];

	requirePortalParam();

	if ( portalParam === 'wikipedia.org' ) {
		console.log( 'Cannot override ' + portalParam + ' portal using fetch-meta.' );
		return process.exit( 1 );
	}

	if ( portalParam === 'all' ) {
		portalsFromMeta = [ 'wikibooks.org', 'wikimedia.org', 'wikinews.org', 'wikiquote.org', 'wikiversity.org', 'wikivoyage.org', 'wiktionary.org' ];

		portalsFromMeta.forEach( function ( wiki ) {
			var portalRequest = preq.get( 'https://meta.wikimedia.org/w/index.php?title=Www.' + wiki + '_template&action=raw' )
				.then( function ( response ) {
					return fs.writeFileSync( 'prod/' + wiki + '/index.html', response.body, 'utf8' );
				} );
			portalRequests.push( portalRequest );
		} );
	} else {
		portalRequest = preq.get( 'https://meta.wikimedia.org/w/index.php?title=Www.' + portalParam + '_template&action=raw' )
			.then( function ( response ) {
				return fs.writeFileSync( 'prod/' + portalParam + '/index.html', response.body, 'utf8' );
			} );
		portalRequests.push( portalRequest );
	}

	return Promise.all( portalRequests );
}
gulp.task( 'fetch-meta', fetchMeta );

/**
 * Remove existing SVG sprite before generating a new one.
 *
 * @return {Stream}
 */
function cleanSprites() {
	var conf = getConfig();
	return del( [ conf.img.sprite.outputSVGGlob, conf.img.sprite.outputPNGGlob ] );
}
gulp.task( 'cleanSprites', cleanSprites );

/**
 * Create SVG sprite for use as a CSS background images.
 * Combine SVG images from the assets/img/sprite_assets directory in the dev folder.
 * Output the SVG sprite in the assets/img dir as sprite-*.svg, where * is a cachebusting hash.
 *
 * Also outputs a CSS file for the SVG sprite named sprite.css in the dev CSS folder.
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

/**
 * Create a PNG fallback for the SVG sprite using PhantomJS.
 *
 * @return {Stream}
 */
function convertSVGtoPNG() {
	return gulp.src( getConfig().img.sprite.outputSVGGlob )
		.pipe( plugins.svg2png() )
		.pipe( gulp.dest( getBaseDir() + 'assets/img/' ) );
}
gulp.task( 'convertSVGtoPNG', gulp.series( 'createSvgSprite', convertSVGtoPNG ) );

/**
 * Optimize PNG fallback.
 *
 * @return {Stream}
 */
function optimizePNGfallback() {
	return gulp.src( getConfig().img.sprite.outputPNGGlob )
		.pipe(
			vinylPaths( function ( imagePath ) {
				return new Promise( function ( resolve, reject ) {
					return execFile( pngquant, [ imagePath, '-f', '-ext', '.png' ], function ( err ) {
						if ( err ) {
							return reject();
						} else {
							return resolve();
						}
					} );
				} );
			} )
		);
}
gulp.task( 'optimizePNGfallback', gulp.series( 'convertSVGtoPNG', optimizePNGfallback ) );

/**
 * Replace '.svg' with '.png' extension in the SVG sprite CSS file.
 * This creates a PNG fallback for the SVG sprite in the sprite.css file.
 *
 * The custom CSS template contains 2 urls that both end with '.svg' until
 * this task changes one of the extensions to '.png'.
 *
 * @return {Stream}
 */
function replaceSVGSpriteCSS() {
	return gulp.src( getConfig().img.sprite.outputCSSPath )
		.pipe( replace( '.svg")/* replace */;', '.png");' ) )
		.pipe( gulp.dest( getBaseDir() + 'assets/css/' ) );
}
gulp.task( 'replaceSVGSpriteCSS', gulp.series( 'createSvgSprite', replaceSVGSpriteCSS ) );

/**
 * Copy images to prod folder.
 *
 * @return {Stream}
*/
function copyImages() {

	var conf = getConfig();
	requirePortalParam();
	return gulp.src( conf.img.src ).pipe( gulp.dest( conf.img.dest ) );
}

gulp.task( 'svgSprite', gulp.series( 'createSvgSprite', 'convertSVGtoPNG', 'optimizePNGfallback', 'replaceSVGSpriteCSS' ) );

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

	function writePurgeFile( UrlsToPurge ) {
		var fileContents = UrlsToPurge.join( '\n' );
		fs.writeFileSync( purgeFile, fileContents );
	}

	return gulp.src( portalAssetDirs, { buffer: false, read: false } )
		.pipe( gulpSlash() ) // Because windows slashes are '\' instead of '/'
		.pipe( plugins.tap( assetFilesStream ) )
		.on( 'end', function () {
			writePurgeFile( UrlsToPurge );
		} );
}
/**
 * Creates a symlink in the production folder which is required
 * by the Apache config:
 * https://gerrit.wikimedia.org/r/plugins/gitiles/operations/puppet/+/refs/heads/production/modules/mediawiki/templates/apache/sites/wwwportals.conf.erb
 * @return {Stream}
 */
function createProdSymlink() {
	return gulp.src( getProdDir() )
		.pipe( gulp.symlink( getProdDir() + '/portal',
			{ relativeSymlinks: true }
		) );
}

/**
 * Watch for changes in dev folder and compile:
 * - handlebars templates
 * - postCSS files
 * into dev folder.
 */
function watch() {

	requirePortalParam();

	gulp.watch( getConfig().watch.sprites, [], [ 'svgSprite' ] );
	gulp.watch( getConfig().watch.hb, [], [ 'compile-handlebars' ] );
	gulp.watch( getConfig().watch.postcss, [], [ 'postcss' ] );

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
