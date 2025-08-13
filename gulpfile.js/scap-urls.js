'use strict';

const gulp = require( 'gulp' ),
	gulpLoadPlugins = require( 'gulp-load-plugins' ),
	fs = require( 'fs' ),
	plugins = gulpLoadPlugins(),
	gulpSlash = require( 'gulp-slash' );

function updateURLsToPurge() {
	const UrlsToPurge = [
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
		let domain, urlToPurge;
		domain = file.relative.split( '/' )[ 0 ];
		urlToPurge = 'https://www.' + domain + '/portal/' + file.relative;
		return urlToPurge;
	}

	function addAssetUrl( url ) {
		return UrlsToPurge.push( url );
	}

	function assetFilesStream( file ) {
		let assetUrl;
		if ( file.isDirectory() ) {
			return;
		}
		assetUrl = createAssetUrl( file );
		return addAssetUrl( assetUrl );
	}

	function writePurgeFile() {
		const fileContents = UrlsToPurge.join( '\n' );
		fs.writeFileSync( purgeFile, fileContents );
	}

	return gulp.src( portalAssetDirs, { buffer: false, read: false } )
		.pipe( gulpSlash() ) // Because windows slashes are '\' instead of '/'
		.pipe( plugins.tap( assetFilesStream ) )
		.on( 'end', () => {
			writePurgeFile();
		} );
}

exports.updateURLsToPurge = updateURLsToPurge;
