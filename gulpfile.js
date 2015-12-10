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
	fs = require( 'fs' );

var baseDir, prodDir,
	plugins = gulpLoadPlugins(),
	config = {},
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

/**
 * Preliminary task for tasks that require the portal param.
 * Also sets config for remaining tasks.
 */
gulp.task( 'build', function () {
	if ( !portalParam ) {
		console.log( '\x1b[31m' );
		console.log( 'Error: please specify the portal you wish to build.' );
		console.log( 'Type gulp help for more information.' );
		console.log( '\x1b[0m' );
		process.exit( 1 );
	}

	baseDir = 'dev/' + portalParam + '/';
	prodDir = 'prod/' + portalParam + '/';

	config.hb = {
		src: baseDir + 'index.handlebars',
		templateData: require( './' + baseDir + 'controller' ),
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
			js: plugins.uglify,
			css: minifyCss,
			disabledTypes: [ 'svg', 'img' ]
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
		hb: [ baseDir + '**/*.handlebars', baseDir + '.json', baseDir + 'controller.js' ]
	};

	config.optImage = {
		src: baseDir + 'assets/img/*',
		pngQuantOptions: { quality: '80-95', speed: 1 },
		dest: prodDir + 'assets/img'
	};

} );

/* List of tasks
 =========================================================================== */

/**
 * Compiles Handlebars templates into dev folder.
 * executes 'build' task if config is undefined
 */

gulp.task( 'compile-handlebars', function () {

	if ( !config.hb ) {
		gulp.start( 'build' );
	}

	return gulp.src( config.hb.src )
		.pipe( plugins.compileHandlebars( config.hb.templateData, config.hb.options ) )
		.pipe( plugins.rename( 'index.html' ) )
		.pipe( gulp.dest( baseDir ) );
} );

/**
 * Inlines assets of index.html in dev folder,
 * moves index.html into prod folder
 */
gulp.task( 'inline-assets', [ 'compile-handlebars' ], function () {
	return gulp.src( config.inline.src )
		.pipe( plugins.inline( config.inline.options ) )
		.pipe( gulp.dest( prodDir ) );
} );

/**
 * Minifies index.html file in prod folder,
 * depends on inline-assets which moves index.html from dev to prod.
 */
gulp.task( 'minify-html', [ 'inline-assets' ], function () {
	return gulp.src( config.htmlmin.src )
		.pipe(  plugins.htmlmin( config.htmlmin.options ) )
		.pipe( gulp.dest( prodDir ) );
} );

/**
 * Optimizes images in dev folder and moves them into prod folder
 */
gulp.task( 'optimize-images', [ 'build' ], function () {
	gulp.src( config.optImage.src )
		.pipe( imageminPngquant( config.optImage.pngQuantOptions )() )
		.pipe( plugins.imagemin() )
		.pipe( gulp.dest( config.optImage.dest ) );
} );

/**
 * Watches for changes in dev folder and compiles handlebars
 * into dev folder.
 */
gulp.task( 'watch', [ 'build', 'compile-handlebars' ], function () {
	gulp.watch( config.watch.hb, [ 'compile-handlebars' ] );
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

gulp.task( 'fetch-meta', [ 'build' ], function () {
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
	.pipe( gulp.dest( prodDir ) );
} );

gulp.task( 'default', [ 'build', 'lint', 'compile-handlebars', 'inline-assets', 'minify-html', 'optimize-images' ] );
gulp.task( 'test', [ 'lint' ] );
