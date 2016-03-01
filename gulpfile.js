/* jshint strict:false */
/* globals require */
/* globals process */
/* globals console */
/* globals JSON */
var gulp = require( 'gulp' ),
	gulpLoadPlugins = require( 'gulp-load-plugins' ),
	argv = require( 'yargs' ).argv,
	imageminPngquant = require( 'imagemin-pngquant' ),
	siteStats = require( './site-stats' ),
	fs = require( 'fs' ),
	sprity = require( 'sprity' ),
	postCSSNext = require( 'postcss-cssnext' ),
	postCSSImport = require( 'postcss-import' );

var plugins = gulpLoadPlugins(),
	portalParam = argv.portal;

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
	console.log( '| gulp inline-assets --portal wikipedia.org   - build inline CSS and JS assets                    |' );
	console.log( '| gulp optimize-images --portal wikipedia.org - run imagemin on image directory                   |' );
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

function getConfig() {
	var config = {},
		baseDir, prodDir;

	baseDir = config.baseDir = 'dev/' + portalParam + '/';
	prodDir = config.prodDir = 'prod/' + portalParam + '/';

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
		return plugins.minifyCss.call( this, options );
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
		src: [ baseDir + 'assets/img/*', '!' + baseDir + 'assets/img/sprite_assets' ],
		pngQuantOptions: { quality: '57-95', speed: 1 },
		dest: prodDir + 'assets/img'
	};

	getConfig = function () {
		return config;
	};
	return config;
}

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
		.pipe( gulp.dest( getConfig().baseDir ) );
} );

/**
 * Compiles CSSNext files into regular CSS and
 * outputs them into the CSS dev folder.
 */
gulp.task( 'cssnext', function () {

	requirePortalParam();

	return gulp.src( getConfig().baseDir + 'assets/cssnext/style.css' )
		.pipe( plugins.postcss( [
			postCSSImport(),
			postCSSNext()
		],
			{ map: { inline: true } }
		) )
		.pipe( gulp.dest( getConfig().baseDir + 'assets/css/' ) );
} );

/**
 * Inlines assets of index.html in dev folder,
 * moves index.html into prod folder
 */
gulp.task( 'inline-assets', [ 'compile-handlebars', 'cssnext' ], function () {

	requirePortalParam();

	return gulp.src( getConfig().inline.src )
		.pipe( plugins.inline( getConfig().inline.options ) )
		.pipe( gulp.dest( getConfig().prodDir ) );
} );

/**
 * Cleans `assets/js/` folder from the production folder.
 */
gulp.task( 'clean-prod-js', [ 'inline-assets' ], function () {
	var del = require( 'del' );
	return del( [ getConfig().prodDir + '/assets/js' ] );
} );

/**
 * Concatenates JS files into a single file and minifies it.
 */
gulp.task( 'concat-minify-js', [ 'clean-prod-js' ], function () {

	requirePortalParam();

	return gulp.src( getConfig().htmlmin.src )
		.pipe( plugins.useref( { searchPath: getConfig().baseDir } ) )
		.pipe( plugins[ 'if' ]( '*.js', plugins.uglify() ) )
		.pipe( plugins[ 'if' ]( '*.js', plugins.rev() ) )
		.pipe( plugins.revReplace() )
		.pipe( gulp.dest( getConfig().prodDir ) )
		.pipe( plugins.rev.manifest() )
		.pipe( gulp.dest( getConfig().baseDir + 'assets' ) );
} );

/**
 * Minifies index.html file in prod folder,
 * depends on inline-assets which moves index.html from dev to prod.
 */
gulp.task( 'minify-html', [ 'inline-assets', 'concat-minify-js' ], function () {

	requirePortalParam();

	return gulp.src( getConfig().htmlmin.src )
		.pipe( plugins.htmlmin( getConfig().htmlmin.options ) )
		.pipe( gulp.dest( getConfig().prodDir ) );
} );

/**
 * Optimizes images in dev folder and moves them into prod folder
 */
gulp.task( 'optimize-images', function () {

	requirePortalParam();

	return gulp.src( getConfig().optImage.src )
		.pipe( plugins.imagemin() )
		.pipe( imageminPngquant( getConfig().optImage.pngQuantOptions )() )
		.pipe( gulp.dest( getConfig().optImage.dest ) );
} );

/**
 * Watches for changes in dev folder and compiles:
 * - handlebars templates
 * - CSSNext files
 * into dev folder.
 */
gulp.task( 'watch', [ 'compile-handlebars', 'sprite', 'cssnext' ], function () {

	requirePortalParam();

	gulp.watch( getConfig().watch.hb, [ 'compile-handlebars' ] );
	gulp.watch( getConfig().watch.sprites, [ 'sprite' ] );
	gulp.watch( getConfig().watch.cssnext, [ 'cssnext' ] );
} );

/**
 * Lints js in dev folder as well as in root folder.
 */
gulp.task( 'lint', function () {
	var devFolder = 'dev/**/*.js';
	if ( portalParam ) {
		// only run on this portal files.
		devFolder = 'dev/' + portalParam + '/**/*.js';
	}
	gulp.src( [ '*.js', devFolder ] )
		.pipe( plugins.jshint( '.jshintrc' ) )
		.pipe( plugins.jshint.reporter( 'default' ) )
		.pipe( plugins.jscs() )
		.pipe( plugins.jscs.reporter() );
} );

gulp.task( 'update-stats', function () {
	siteStats.getSiteStats().then( function ( stats ) {
		fs.writeFileSync( 'site-stats.json', JSON.stringify( stats, null, '\t' ) );
	} );
} );

gulp.task( 'fetch-meta', function () {

	requirePortalParam();

	if ( portalParam === 'wikipedia.org' ) {
		console.log( 'Cannot override ' + portalParam + ' portal using fetch-meta.' );
		process.exit( 1 );
		return;
	}
	plugins.downloader( {
		fileName: 'index.html',
		request: {
			url: 'https://meta.wikimedia.org/w/index.php?title=Www.' + portalParam + '_template&action=raw'
		}
	} )
		.pipe( gulp.dest( getConfig().prodDir ) );
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
		src: getConfig().baseDir + 'assets/img/sprite_assets/**/*.{png,jpg}',
		cssPath: 'portal/wikipedia.org/assets/img/',
		style: getConfig().baseDir + 'assets/css/sprites.css',
		prefix: 'sprite',
		dimension: [ { ratio: 1, dpi: 72 },
			{ ratio: 1.5, dpi: 144 },
			{ ratio: 2, dpi: 192 }
		],
		split: true,
		margin: 0
	} )
	.pipe( plugins[ 'if' ]( '*.png', gulp.dest( getConfig().baseDir + 'assets/img/' ), gulp.dest( getConfig().baseDir + 'assets/css/' ) ) );
} );

gulp.task( 'default', [ 'lint', 'compile-handlebars', 'sprite', 'cssnext', 'inline-assets', 'clean-prod-js', 'concat-minify-js', 'minify-html', 'optimize-images' ] );

gulp.task( 'test', [ 'lint' ] );
