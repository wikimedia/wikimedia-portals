/* jshint strict:false */
/* globals require */
/* globals process */
/* globals console */
var gulp = require( 'gulp' ),
	gulpLoadPlugins = require( 'gulp-load-plugins' ),
	argv = require( 'yargs' ).argv,
	imageminPngquant = require( 'imagemin-pngquant' );

var plugins = gulpLoadPlugins(),
	portalParam = argv.portal;

if ( !portalParam && process.argv[ 2 ] !== 'help' ) {
	console.log( '\x1b[31m' );
	console.log( 'Error: please specify the portal you wish to build.' );
	console.log( 'Type gulp help for more information.' );
	console.log( '\x1b[0m' );
	process.exit( 1 );
}

var baseDir = 'dev/' + portalParam + '/',
	prodDir = 'prod/' + portalParam + '/';

gulp.task( 'help', function () {
	console.log();
	console.log( '+-------------------------------------------------------------------------------------------------+' );
	console.log( '|                                     =====  USAGE     =====                                      |' );
	console.log( '+-------------------------------------------------------------------------------------------------+' );
	console.log( '| gulp inline-assets --portal wikipedia.org   - build inline CSS and JS assets                    |' );
	console.log( '| gulp optimize-images --portal wikipedia.org - run imagemin on image directory                   |' );
	console.log( '| gulp lint --portal wikipedia.org            - run jslint on JS files on portal                  |' );
	console.log( '| gulp --portal wikipedia.org                 - run all of the above on the specified portal page |' );
	console.log( '+-------------------------------------------------------------------------------------------------+' );
	console.log();
} );

gulp.task( 'inline-assets', function () {
	gulp.src( baseDir + 'index.html' )
		.pipe( plugins.inline( {
			base: baseDir,
			js: plugins.uglify,
			css: plugins.minifyCss,
			disabledTypes: [ 'svg', 'img' ]
		} ) )
		.pipe( gulp.dest( prodDir ) );
} );

gulp.task( 'optimize-images', function () {
	gulp.src( baseDir + 'assets/img/*' )
		.pipe( imageminPngquant( { quality: '80-95', speed: 1 } )() )
		.pipe( plugins.imagemin() )
		.pipe( gulp.dest( prodDir + 'assets/img' ) );
} );

gulp.task( 'lint', function () {
	gulp.src( [ 'gulpfile.js', baseDir + 'assets/js/*.js' ] )
		.pipe( plugins.jshint( '.jshintrc' ) )
		.pipe( plugins.jshint.reporter( 'default' ) )
		.pipe( plugins.jscs() )
		.pipe( plugins.jscs.reporter() );
} );

gulp.task( 'default', [ 'lint', 'inline-assets', 'optimize-images' ] );
