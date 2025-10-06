'use strict';

const l10n = require( '../../l10n/en.json' ), // These will be global values
	rtlLanguages = require( './rtl-languages.json' ),
	stats = require( '../../data/stats' ),
	crypto = require( 'crypto' ),
	deleteFiles = require( '../../data/utils' ),
	translationPath = __dirname + '/assets/l10n/',
	fs = require( 'fs' );
let cachebuster = null;
// This is specific to Wikimedia.
l10n.portal = l10n.wikimedia;

const i18nData = stats.readi18nFiles( __dirname + '/../../l10n/' );

function createTranslationsChecksum() {
	const data = JSON.stringify( i18nData );
	// Truncating hash for legibility
	return crypto.createHash( 'md5' ).update( data ).digest( 'hex' ).slice( 0, 8 );
}

cachebuster = createTranslationsChecksum();

if ( fs.existsSync( translationPath ) ) {
	deleteFiles( translationPath, 1 );
} else {
	fs.mkdirSync( translationPath );
}

function createTranslationFiles() {
	function writeFile( el, langCode ) {
		if ( el.code ) {
			langCode = el.code;
		}

		const fileName = translationPath + langCode + '-' + cachebuster + '.json';
		const fileContent = JSON.stringify( el );

		// eslint-disable-next-line security/detect-non-literal-fs-filename
		fs.writeFileSync( fileName, fileContent );
	}

	for ( const lang in i18nData ) {
		if ( i18nData[ lang ].sublinks ) {
			i18nData[ lang ].sublinks.forEach( writeFile );
		} else {
			writeFile( i18nData[ lang ], lang );
		}
	}
}

createTranslationFiles();

const Controller = {
	rtlLanguages: rtlLanguages,
	rtlLanguagesStringified: '[\'' + rtlLanguages.join( '\',\'' ) + '\']',
	l10n,
	translationChecksum: cachebuster
};

module.exports = Controller;
