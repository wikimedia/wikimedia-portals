/* eslint-env node, es6 */
var l10n = require( '../../l10n/en.json' ), // These will be global values
	rtlLanguages = require( './rtl-languages.json' ),
	Controller,
	i18nData,
	stats = require( '../../data/stats' ),
	crypto = require( 'crypto' ),
	deleteFiles = require( '../../data/utils' ),
	translationPath = __dirname + '/assets/l10n/',
	cachebuster,
	fs = require( 'fs' );
// This is specific to Wikimedia.
l10n.portal = l10n.wikimedia;

i18nData = stats.readi18nFiles( __dirname + '/../../l10n/' );

function createTranslationsChecksum() {
	var data = JSON.stringify( i18nData ),
		hash = crypto.createHash( 'md5' ).update( data ).digest( 'hex' );
	// Truncating hash for legibility
	hash = hash.slice( 0, 8 );
	return hash;
}

cachebuster = createTranslationsChecksum();

if ( fs.existsSync( translationPath ) ) {
	deleteFiles( translationPath, 1 );
} else {
	fs.mkdirSync( translationPath );
}

function createTranslationFiles() {
	var fileName, lang;

	function writeFile( el, langCode ) {
		var fileContent;

		if ( el.code ) {
			langCode = el.code;
		}

		fileName = translationPath + langCode + '-' + cachebuster + '.json';
		fileContent = JSON.stringify( el );

		// eslint-disable-next-line security/detect-non-literal-fs-filename
		fs.writeFileSync( fileName, fileContent );
	}

	for ( lang in i18nData ) {
		if ( i18nData[ lang ].sublinks ) {
			i18nData[ lang ].sublinks.forEach( writeFile );
		} else {
			writeFile( i18nData[ lang ], lang );
		}
	}
}

createTranslationFiles();

Controller = {
	rtlLanguages: rtlLanguages,
	rtlLanguagesStringified: '[\'' + rtlLanguages.join( '\',\'' ) + '\']',
	l10n,
	translationChecksum: cachebuster
};

module.exports = Controller;
