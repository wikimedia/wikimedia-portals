var gulp = require( 'gulp' ),
	gulpLoadPlugins = require( 'gulp-load-plugins' ),
	plugins = gulpLoadPlugins(),
	fs = require( 'fs' ),
	path = require( 'path' ),
	argv = require( 'yargs' ).argv,
	portalParam = argv.portal,
	cssnano = require( 'cssnano' );

const { requirePortalParam, getBaseDir, getConfig, getProdDir } = require( './config' );

/**
 * Inline assets of index.html in src folder
 * and move index.html into prod folder
 *
 * @return {Stream}
 */
function inlineAssets() {

	requirePortalParam();

	const preset = {
		preset: [
			'default', {
				discardComments: {
					removeAll: true
				}
			} ]
	};

	return gulp.src( getBaseDir() + 'index.html' )
		.pipe( plugins.inline( {
			css: plugins.postcss.bind( this, [ ( cssnano( preset ) ) ] ),
			disabledTypes: [ 'svg', 'img', 'js' ]
		} ) )
		.pipe( gulp.dest( getProdDir() ) );
}

/**
 * Clean `assets/js/` folder from the prod folder.
 * @param cb
 */
function cleanProdJS( cb ) {
	try {
		var prodDir = getProdDir();
		var jsFolderPath = path.join( prodDir, 'assets', 'js' );

		if ( fs.existsSync( jsFolderPath ) ) {
			fs.rmdirSync( jsFolderPath, { recursive: true } );
			console.log( `Cleaned: ${jsFolderPath}` );
			cb(); // Callback after success
		} else {
			console.log( `Directory does not exist: ${jsFolderPath}` );
			cb(); // Callback after success (assuming cleaning is not needed if the directory doesn't exist)
		}
	} catch ( error ) {
		console.error( 'Error cleaning prod JS:', error );
		cb( error ); // Callback with error if there's an error cleaning the directory
	}
}
function copyTranslationFiles() {
	requirePortalParam();

	const prodDir = getProdDir();
	const assetsDir = path.join( prodDir, 'assets', 'l10n' );

	if ( fs.existsSync( assetsDir ) ) {
		// Remove existing JSON files in the destination directory
		fs.readdirSync( assetsDir )
			.filter( file => file.endsWith( '.json' ) )
			.forEach( file => fs.unlinkSync( path.join( assetsDir, file ) ) );
	} else {
		console.log( `Directory does not exist: ${assetsDir}` );
	}
	return gulp.src( path.join( getBaseDir(), 'assets', 'l10n/**/*.json' ) )
		.pipe( gulp.dest( assetsDir ) );
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
 * depends on inlineAssets which moves index.html from src to prod.
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
 * Copy images to prod folder.
 *
 * @return {Stream}
 */
function copyImages() {

	var conf = getConfig();
	requirePortalParam();
	return gulp.src( conf.img.src ).pipe( gulp.dest( conf.img.dest ) );
}

/**
 * Creates a symlink in the production folder which is required
 * by the Apache config:
 * https://gerrit.wikimedia.org/r/plugins/gitiles/operations/puppet/+/refs/heads/production/modules/mediawiki/templates/apache/sites/wwwportals.conf.erb
 *
 * @return {Stream}
 */
function createProdSymlink() {
	return gulp.src( getProdDir() )
		.pipe( gulp.symlink( getProdDir() + '/portal',
			{ relativeSymlinks: true }
		) );
}

exports.inlineAssets = inlineAssets;
exports.cleanProdJS = cleanProdJS;
exports.copyTranslationFiles = copyTranslationFiles;
exports.concatMinifyJS = concatMinifyJS;
exports.minifyHTML = minifyHTML;
exports.copyImages = copyImages;
exports.createProdSymlink = createProdSymlink;
