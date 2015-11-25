/* jshint strict:false */
/* globals require */
/* globals process */
/* globals console */
var gulp = require( 'gulp' ),
	gulpLoadPlugins = require( 'gulp-load-plugins' ),
	argv = require( 'yargs' ).argv,
	imageminPngquant = require( 'imagemin-pngquant' ),
	siteStats = require( './site-stats' ),
	fs = require( 'fs' );

var baseDir, prodDir,
	plugins = gulpLoadPlugins(),
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
	console.log( '| gulp --portal wikipedia.org                 - run all of the above on the specified portal page |' );
	console.log( '|                                                                                                 |' );
	console.log( '| gulp fetch-meta --portal wikipedia.org      - overwrite the portal page with source from Meta   |' );
	console.log( '+-------------------------------------------------------------------------------------------------+' );
	console.log();
} );

// This task is a preliminary task for the tasks that require the portal param.
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
} );

/* List of tasks
 =========================================================================== */

gulp.task( 'inline-assets', [ 'build' ], function () {
	gulp.src( baseDir + 'index.html' )
		.pipe( plugins.inline( {
			base: baseDir,
			js: plugins.uglify,
			css: plugins.minifyCss,
			disabledTypes: [ 'svg', 'img' ]
		} ) )
		.pipe( gulp.dest( prodDir ) );
} );

gulp.task( 'optimize-images', [ 'build' ], function () {
	gulp.src( baseDir + 'assets/img/*' )
		.pipe( imageminPngquant( { quality: '80-95', speed: 1 } )() )
		.pipe( plugins.imagemin() )
		.pipe( gulp.dest( prodDir + 'assets/img' ) );
} );

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

gulp.task( 'default', [ 'build', 'lint', 'inline-assets', 'optimize-images' ] );
gulp.task( 'test', [ 'lint' ] );
