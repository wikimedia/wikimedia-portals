/* jshint strict:false */
/* globals require */
/* globals process */
/* globals console */
/* globals JSON */
/* eslint dot-notation: ["error", { "allowKeywords": false }] */
var gulp = require( 'gulp' ),
	gulpLoadPlugins = require( 'gulp-load-plugins' ),
	argv = require( 'yargs' ).argv,
	imagemin = require( 'gulp-imagemin' ),
	imageminPngquant = require( 'imagemin-pngquant' ),
	imageminZopfli = require( 'imagemin-zopfli' ),
	siteStats = require( './data/site-stats' ),
	fs = require( 'fs' ),
	exec = require( 'child_process' ).exec,
	sprity = require( 'sprity' ),
	postCSSNext = require( 'postcss-cssnext' ),
	postCSSImport = require( 'postcss-import' ),
	postCSSReporter = require( 'postcss-reporter' ),
	gulpStylelint = require( 'gulp-stylelint' ),
	del = require( 'del' );

var plugins = gulpLoadPlugins(),
	portalParam = argv.portal;

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
	console.log( '| gulp optimize-images --portal wikipedia.org - run imagemin on image directory                   |' );
	console.log( '| gulp watch --portal wikipedia.org           - watches dev directory and generates an index.html |' );
	console.log( '|                                               file in it without inlined/minified assets        |' );
	console.log( '| gulp --portal wikipedia.org                 - run all of the above on the specified portal page |' );
	console.log( '|                                                                                                 |' );
	console.log( '| gulp fetch-meta --portal wikipedia.org      - overwrite the portal page with source from Meta   |' );
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

var getBaseDir, getProdDir, getConfig;
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

	var minifyCss = function () {
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

	config.optImage = {
		imageminConf: {
			plugins: [
				imagemin.svgo(),
				imageminPngquant( { quality: '57-95', speed: 1 } ),
				imagemin.optipng(),
				imageminZopfli()
			],
			options: { verbose: true }
		},
		src: [ baseDir + 'assets/img/*', '!' + baseDir + 'assets/img/sprite_assets' ],
		dest: prodDir + 'assets/img'
	};

	getConfig = function () {
		return config;
	};
	return getConfig();
};

/* List of tasks
 =========================================================================== */

/**
 * Compiles Handlebars templates into dev folder.
 * executes 'build' task if config is undefined
 */

gulp.task( 'compile-handlebars', function () {

	requirePortalParam();

	return gulp.src( getConfig().hb.src )
		.pipe( plugins.compileHandlebars( getConfig().hb.templateData, getConfig().hb.options ) )
		.pipe( plugins.rename( 'index.html' ) )
		.pipe( gulp.dest( getBaseDir() ) );
} );

/**
 * Compiles postCSS files into regular CSS and
 * outputs them into the CSS dev folder.
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
 * Inlines assets of index.html in dev folder,
 * moves index.html into prod folder
 */
gulp.task( 'inline-assets', [ 'compile-handlebars', 'postcss' ], function () {

	requirePortalParam();

	return gulp.src( getConfig().inline.src )
		.pipe( plugins.inline( getConfig().inline.options ) )
		.pipe( gulp.dest( getProdDir() ) );
} );

/**
 * Cleans `assets/js/` folder from the production folder.
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
 * Concatenates JS files into a single file and minifies it.
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
 * Minifies index.html file in prod folder,
 * depends on inline-assets which moves index.html from dev to prod.
 */
gulp.task( 'minify-html', [ 'inline-assets', 'concat-minify-js' ], function () {

	requirePortalParam();

	return gulp.src( getConfig().htmlmin.src )
		.pipe( plugins.htmlmin( getConfig().htmlmin.options ) )
		.pipe( gulp.dest( getProdDir() ) );
} );

/**
 * Optimizes images in dev folder and moves them into prod folder
 */
gulp.task( 'optimize-images', function () {

	requirePortalParam();

	var imgOpt = getConfig().optImage;

	return gulp.src( imgOpt.src )
		.pipe( imagemin( imgOpt.imageminConf.plugins, imgOpt.imageminConf.options ) )
		.pipe( gulp.dest( imgOpt.dest ) );
} );

/**
 * Watches for changes in dev folder and compiles:
 * - handlebars templates
 * - postCSS files
 * into dev folder.
 */
gulp.task( 'watch', [ 'compile-handlebars', 'sprite', 'postcss' ], function () {

	requirePortalParam();

	gulp.watch( getConfig().watch.hb, [ 'compile-handlebars' ] );
	gulp.watch( getConfig().watch.sprites, [ 'sprite' ] );
	gulp.watch( getConfig().watch.postcss, [ 'postcss' ] );
} );

/**
 * Lints js in dev folder as well as in root folder.
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

	requirePortalParam();

	if ( portalParam === 'wikipedia.org' ) {
		/* eslint-disable no-console */
		console.log( 'Cannot override ' + portalParam + ' portal using fetch-meta.' );
		/* eslint-enable no-console */
		process.exit( 1 );
		return;
	}
	if ( portalParam === 'all' ) {

		var portalsFromMeta = [ 'wikibooks.org', 'wikimedia.org', 'wikinews.org', 'wikiquote.org', 'wikiversity.org', 'wikivoyage.org', 'wiktionary.org' ];

		portalsFromMeta.forEach( function ( wiki ) {
			exec( ' curl -Lo prod/' + wiki + '/index.html  "https://meta.wikimedia.org/w/index.php?title=Www.' + wiki + '_template&action=raw" ' );
		} );

	} else {
		exec( ' curl -Lo ' + getProdDir() + 'index.html  "https://meta.wikimedia.org/w/index.php?title=Www.' + portalParam + '_template&action=raw" ' );
	}

} );

/**
 * Generates images sprites and accompanying CSS files using Sprity.
 * Outputs sprites into dev assets/img folder.
 * Outputs css into dev css/sprites.css file.
 *
 * Sprites are seperated into subfolders in img/sprite_assets.
 * The contents of each folder will output a single sprite, named after the folder.
 * Sprity will generate @2x, @1.5x, and @1x versions of the sprite.
 *
 * You should only supply and place the @2x versions of the assets into the sprite folders.
 */
gulp.task( 'sprite', function () {

	requirePortalParam();

	return sprity.src( {
		src: getBaseDir() + 'assets/img/sprite_assets/**/*.{png,jpg}',
		cssPath: 'portal/wikipedia.org/assets/img/',
		style: getBaseDir() + 'assets/css/sprites.css',
		prefix: 'sprite',
		dimension: [ { ratio: 1, dpi: 72 },
			{ ratio: 1.5, dpi: 144 },
			{ ratio: 2, dpi: 192 }
		],
		split: true,
		margin: 0,
		cachebuster: true
	} )
	.pipe( plugins[ 'if' ]( '*.png', gulp.dest( getBaseDir() + 'assets/img/' ), gulp.dest( getBaseDir() + 'assets/css/' ) ) );
} );

gulp.task( 'lint', [ 'lint-js', 'lint-css' ] );

gulp.task( 'test', [ 'lint' ] );

gulp.task( 'default', [ 'lint', 'compile-handlebars', 'sprite', 'postcss', 'inline-assets', 'clean-prod-js', 'concat-minify-js', 'minify-html', 'optimize-images', 'copy-translation-files' ] );
