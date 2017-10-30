/* jshint strict:false */
/* globals require */
/* globals process */
/* globals console */
/* globals JSON */
/* globals Buffer */
/* eslint dot-notation: ["error", { "allowKeywords": false }] */
var gulp = require( 'gulp' ),
	gulpLoadPlugins = require( 'gulp-load-plugins' ),
	argv = require( 'yargs' ).argv,
	siteStats = require( './data/site-stats' ),
	fs = require( 'fs' ),
	exec = require( 'child_process' ).exec,
	postCSSNext = require( 'postcss-cssnext' ),
	postCSSImport = require( 'postcss-import' ),
	postCSSReporter = require( 'postcss-reporter' ),
	gulpStylelint = require( 'gulp-stylelint' ),
	del = require( 'del' ),
	plugins = gulpLoadPlugins(),
	gulpSlash = require( 'gulp-slash' ),
	replace = require( 'gulp-replace' ),
	portalParam = argv.portal,
	getBaseDir, getProdDir, getConfig;

// Help
gulp.task( 'help', function () {
	/* eslint-disable no-console */
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
	console.log( '| gulp inline-assets --portal wikipedia.org   - build inline CSS and JS assets                    |' );
	console.log( '| gulp watch --portal wikipedia.org           - watches dev directory and generates an index.html |' );
	console.log( '|                                               file in it without inlined/minified assets        |' );
	console.log( '| gulp --portal wikipedia.org                 - run all of the above on the specified portal page |' );
	console.log( '|                                                                                                 |' );
	console.log( '| gulp fetch-meta --portal wikipedia.org      - overwrite the portal page with source from Meta   |' );
	console.log( '| gulp update-urls-to-purge        - creates the urls-to-purge.txt file to purge the server cache |' );
	console.log( '+-------------------------------------------------------------------------------------------------+' );
	console.log();
	/* eslint-enable no-console */
} );

/* Preliminary configuration
 =========================================================================== */

/**
 * Preliminary task for tasks that require the portal param.
 * Also sets config for remaining tasks.
 */
function requirePortalParam() {
	if ( !portalParam ) {
		/* eslint-disable no-console */
		console.log( '\x1b[31m' );
		console.log( 'Error: please specify the portal you wish to build.' );
		console.log( 'Type gulp help for more information.' );
		console.log( '\x1b[0m' );
		/* eslint-enable no-console */
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
		baseDir, prodDir, minifyCss;

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

	minifyCss = function () {
		var options = {
			compatibility: 'ie7',
			keepSpecialComments: '0'
		};
		return plugins.cleanCss.call( this, options );
	};

	config.inline = {
		src: baseDir + 'index.html',
		options: {
			base: baseDir,
			css: minifyCss,
			disabledTypes: [ 'svg', 'img', 'js' ]
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
			outputCSSPath: baseDir + 'assets/css/' + 'sprite.css', /* outputCSS value */
			outputSVGGlob: baseDir + 'assets/img/' + 'sprite' /* outputName */ + '*.svg',
			outputPNGGlob: baseDir + 'assets/img/' + 'sprite' /* outputName */ + '*.png',
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
 */

gulp.task( 'compile-handlebars', function () {

	requirePortalParam();

	return gulp.src( getConfig().hb.src )
		.pipe( plugins.compileHandlebars( getConfig().hb.templateData, getConfig().hb.options ) )
		.pipe( plugins.rename( 'index.html' ) )
		.pipe( gulp.dest( getBaseDir() ) );
} );

/**
 * Compile postCSS files into regular CSS and
 * output them into the CSS dev folder.
 */
gulp.task( 'postcss', function () {

	requirePortalParam();

	return gulp.src( [ getBaseDir() + 'assets/postcss/*.css', '!' + getBaseDir() + 'assets/postcss/_*.css' ] )
		.pipe( plugins.postcss( [
			postCSSImport(),
			postCSSNext( { browsers: [ 'last 5 versions', 'ie 6-8', 'Firefox >= 3.5', 'iOS >= 4', 'Android >= 2.3' ] } )
		],
			{ map: { inline: true } }
		) )
		.pipe( gulp.dest( getBaseDir() + 'assets/css/' ) );
} );

/**
 * Inline assets of index.html in dev folder
 * and move index.html into prod folder
 */
gulp.task( 'inline-assets', [ 'compile-handlebars', 'postcss' ], function () {

	requirePortalParam();

	return gulp.src( getConfig().inline.src )
		.pipe( plugins.inline( getConfig().inline.options ) )
		.pipe( gulp.dest( getProdDir() ) );
} );

/**
 * Clean `assets/js/` folder from the prod folder.
 */
gulp.task( 'clean-prod-js', [ 'inline-assets' ], function () {
	return del( [ getProdDir() + '/assets/js' ] );
} );

gulp.task( 'copy-translation-files', [ 'compile-handlebars' ], function () {

	requirePortalParam();

	del( getProdDir() + '/assets/l10n/**/*.json' );

	return gulp.src( getBaseDir() + '/assets/l10n/**/*.json' )
		.pipe( gulp.dest( getProdDir() + '/assets/l10n/' ) );
} );

/**
 * Concatenate JS files into a single file and minify it.
 */
gulp.task( 'concat-minify-js', [ 'clean-prod-js' ], function () {

	requirePortalParam();

	return gulp.src( getConfig().htmlmin.src )
		.pipe( plugins.useref( { searchPath: getBaseDir() } ) )
		.pipe( plugins[ 'if' ]( '*.js', plugins.uglify() ) )
		.pipe( plugins[ 'if' ]( '*.js', plugins.rev() ) )
		.pipe( plugins.revReplace() )
		.pipe( gulp.dest( getProdDir() ) )
		.pipe( plugins.rev.manifest() )
		.pipe( gulp.dest( getBaseDir() + 'assets' ) );
} );

/**
 * Minify index.html file in prod folder,
 * depends on inline-assets which moves index.html from dev to prod.
 */
gulp.task( 'minify-html', [ 'inline-assets', 'concat-minify-js' ], function () {

	requirePortalParam();

	return gulp.src( getConfig().htmlmin.src )
		.pipe( plugins.htmlmin( getConfig().htmlmin.options ) )
		.pipe( gulp.dest( getProdDir() ) );
} );

/**
 * Watch for changes in dev folder and compile:
 * - handlebars templates
 * - postCSS files
 * into dev folder.
 */
gulp.task( 'watch', [ 'compile-handlebars', 'svgSprite', 'postcss' ], function () {

	requirePortalParam();

	gulp.watch( getConfig().watch.hb, [ 'compile-handlebars' ] );
	gulp.watch( getConfig().watch.sprites, [ 'svgSprite' ] );
	gulp.watch( getConfig().watch.postcss, [ 'postcss' ] );
} );

/**
 * Lint JS in dev folder as well as in root folder.
 */
gulp.task( 'lint-js', function () {
	var devFolder = 'dev/**/*.js';
	if ( portalParam ) {
		// only run on this portal files.
		devFolder = 'dev/' + portalParam + '/**/*.js';
	}
	gulp.src( [ '*.js', devFolder ] )
		.pipe( plugins.eslint( '.eslintrc.json' ) )
		.pipe( plugins.eslint.format() )
		.pipe( plugins.eslint.failAfterError() );
} );

gulp.task( 'validate-postCSS', function () {
	return gulp
		.src( [ 'dev/**/postcss/*.css', '!dev/**/postcss/_*.css' ] )
		.pipe( plugins.postcss(
			[
				postCSSImport(),
				postCSSNext( { browsers: [ 'last 5 versions', 'ie 6-8', 'Firefox >= 3.5', 'iOS >= 4', 'Android >= 2.3' ] } ),
				postCSSReporter( { clearMessages: true, throwError: true } )
			], { map: { inline: true } }
		) );
} );

gulp.task( 'lint-css', [ 'validate-postCSS' ], function () {

	return gulp
		.src( 'dev/**/postcss/*.css' )
		.pipe( gulpStylelint( {
			reporters: [
				{ formatter: 'string', console: true }
			]
		} ) );
} );

gulp.task( 'update-stats', function () {
	siteStats.getSiteStats().then( function ( stats ) {
		fs.writeFileSync( './data/site-stats.json', JSON.stringify( stats, null, '\t' ) );
	} );
} );

gulp.task( 'fetch-meta', function () {
	var portalsFromMeta;

	requirePortalParam();

	if ( portalParam === 'wikipedia.org' ) {
		/* eslint-disable no-console */
		console.log( 'Cannot override ' + portalParam + ' portal using fetch-meta.' );
		/* eslint-enable no-console */
		process.exit( 1 );
		return;
	}
	if ( portalParam === 'all' ) {

		portalsFromMeta = [ 'wikibooks.org', 'wikimedia.org', 'wikinews.org', 'wikiquote.org', 'wikiversity.org', 'wikivoyage.org', 'wiktionary.org' ];

		portalsFromMeta.forEach( function ( wiki ) {
			exec( ' curl -Lo prod/' + wiki + '/index.html  "https://meta.wikimedia.org/w/index.php?title=Www.' + wiki + '_template&action=raw" ' );
		} );

	} else {
		exec( ' curl -Lo ' + getProdDir() + 'index.html  "https://meta.wikimedia.org/w/index.php?title=Www.' + portalParam + '_template&action=raw" ' );
	}

} );

/**
 * Create a 'urls-to-purge.txt' file at the root of the repo that
 * contains a list of URL's that must be purged from the server cache.
 * These URLs include the root portal urls for all portals and all
 * production asset URLs in this repo.
 *
 * Must be run when after all assets have been versioned, minified &
 * copied into the prod dir.
 */
gulp.task( 'update-urls-to-purge', [ 'compile-handlebars', 'svgSprite', 'postcss', 'inline-assets', 'clean-prod-js', 'concat-minify-js', 'minify-html', 'copy-images', 'copy-translation-files' ], function() {

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
		purgeFile = 'urls-to-purge.txt';

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
		if ( file.isDirectory() ) { return; }
		assetUrl = createAssetUrl( file );
		return addAssetUrl( assetUrl );
	}

	function writePurgeFile( UrlsToPurge ) {
		var fileContents = UrlsToPurge.join( '\n' ),
			fileBuffer = new Buffer( fileContents );
		return fs.writeFile( purgeFile, fileBuffer );
	}

	return gulp.src( portalAssetDirs, { buffer: false, read: false } )
		.pipe( gulpSlash() ) // Because windows slashes are '\' instead of '/'
		.pipe( plugins.tap( assetFilesStream ) )
		.on( 'end', function() {
			writePurgeFile( UrlsToPurge );
		} );
} );

/**
 * Create SVG sprite for use as a CSS background images.
 * Combine SVG images from the assets/img/sprite_assets directory in the dev folder.
 * Output the SVG sprite in the assets/img dir as sprite-*.svg, where * is a cachebusting hash.
 *
 * Also outputs a CSS file for the SVG sprite named sprite.css in the dev CSS folder.
 */
gulp.task( 'createSvgSprite', [ 'cleanSprites' ], function() {
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
	.pipe( plugins[ 'if' ]( '*.svg', gulp.dest( getBaseDir() + 'assets/img/' ), gulp.dest( getBaseDir() + 'assets/css/' ) ) );
} );
/**
 * Remove existing SVG sprite before generating a new one.
 */
gulp.task( 'cleanSprites', function() {
	var conf = getConfig();
	return del( [ conf.img.sprite.outputSVGGlob, conf.img.sprite.outputPNGGlob ] );
} );
/**
 * Create a PNG fallback for the SVG sprite using PhantomJS.
 */
gulp.task( 'convertSVGtoPNG', [ 'createSvgSprite' ], function() {
	return gulp.src( getConfig().img.sprite.outputSVGGlob )
	.pipe( plugins.svg2png() )
	.pipe( gulp.dest( getBaseDir() + 'assets/img/' ) );
} );
/**
 * Replace '.svg' with '.png' extension in the SVG sprite CSS file.
 * This creates a PNG fallback for the SVG sprite in the sprite.css file.
 *
 * The custom CSS template contains 2 urls that both end with '.svg' until
 * this task changes one of the extensions to '.png'.
 */
gulp.task( 'replaceSVGSpriteCSS', [ 'createSvgSprite' ], function() {
	return gulp.src( getConfig().img.sprite.outputCSSPath )
	.pipe( replace( '.svg")/* replace */;', '.png");' ) )
	.pipe( gulp.dest( getBaseDir() + 'assets/css/' ) );
} );
/*
* Copy images to prod folder.
*/
gulp.task( 'copy-images', [ 'createSvgSprite' ], function () {
	var conf = getConfig();
	requirePortalParam();
	return gulp.src( conf.img.src ).pipe( gulp.dest( conf.img.dest ) );
} );

gulp.task( 'svgSprite', [ 'createSvgSprite', 'convertSVGtoPNG', 'replaceSVGSpriteCSS' ] );

gulp.task( 'lint', [ 'lint-js', 'lint-css' ] );

gulp.task( 'test', [ 'lint' ] );

gulp.task( 'default', [
	'lint',
	'compile-handlebars',
	'svgSprite',
	'postcss',
	'inline-assets',
	'clean-prod-js',
	'concat-minify-js',
	'minify-html',
	'copy-images',
	'copy-translation-files',
	'update-urls-to-purge'
] );
