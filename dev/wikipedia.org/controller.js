/* globals require */
/* globals module, __dirname */
var _ = require( 'underscore' ),
	hbs = require( '../../hbs-helpers.global.js' ),
	fs = require( 'fs' ),
	stats = require( '../../data/stats' ),
	otherProjects = require( './other-projects.json' ),
	otherLanguages = require( './other-languages.json' ),
	crypto = require( 'crypto' ),
	top100000List,
	top100000Dropdown,
	Controller,
	translationHashes = [];

// Format the dropdown for ./templates/search.mustache
top100000List = stats.getRange( 'wiki', 'numPages', 100000 );
top100000Dropdown = stats.format( 'wiki', top100000List, {
	stripTags: true
} );

/**
 *  SiteStats returns and object for each language wikipedia by language code.
 *  ex:
 *  "en":{"url":"en.wikipedia.org",
 *        "numPages":"5 077 000",
 *        "views":1723574042,
 *        "siteName":"Wikipedia",
 *        "articles":"articles",
 *        "slogan":"The Free Encyclopedia",
 *        "name":"English",
 *        "lang":"en"
 *        }
 */
var siteStats = {},
	range = stats.getRangeFormatted( 'wiki', 'views', 10 );

_.each( range, function ( wiki ) {
	if ( wiki.closed || wiki.sublinks ) {
		return;
	}
	wiki.numPages = hbs.formatNumber( wiki.numPages, {
		hash: {
			thousandSeparator: true,
			rounded: true,
			nbsp: false
		}
	} ).toString();
	siteStats[ wiki.code ] = _.omit( wiki, 'closed', 'code', 'index' );
} );

/**
 * Writing stats to translation files
 */
var translationPath = __dirname + '/assets/translations/';

function createTranslationsChecksum( hashes ) {
	hashes.sort();

	var hashString = hashes.join( '' ),
		checksum = crypto.createHash( 'md5' ).update( hashString ).digest( 'hex' );

	return checksum;

}

function createTranslationFiles( translationPath, siteStats ) {

	var writeFile = function ( el, lang ) {

		if ( el.code ) {
			lang = el.code;
		}

		var fileName = translationPath + lang + '.json',
			fileContent = JSON.stringify( el ),
			fileHash = crypto.createHash( 'md5' ).update( fileContent ).digest( 'hex' );

		translationHashes.push( fileHash );

		fs.writeFileSync( fileName, fileContent );

	};

	for ( var lang in siteStats ) {
		if ( siteStats[ lang ].sublinks ) {
			siteStats[ lang ].sublinks.forEach( writeFile );
		} else {
			writeFile( siteStats[ lang ], lang );
		}
	}
}

if ( !fs.existsSync( translationPath ) ) {
	fs.mkdirSync( translationPath );
	createTranslationFiles( translationPath, siteStats );
} else {
	createTranslationFiles( translationPath, siteStats );
}

Controller = {
	top10views: stats.getTopFormatted( 'wiki', 'views', 10 ),
	top1000000Articles: stats.getRangeFormatted( 'wiki', 'numPages', 1000000 ),
	top100000Articles: stats.getRangeFormatted( 'wiki', 'numPages', 100000, 1000000 ),
	top10000Articles: stats.getRangeFormatted( 'wiki', 'numPages', 10000, 100000 ),
	top1000Articles: stats.getRangeFormatted( 'wiki', 'numPages', 1000, 10000 ),
	top100Articles: stats.getRangeFormatted( 'wiki', 'numPages', 100, 1000 ),
	top100000Dropdown: top100000Dropdown,
	otherProjects: otherProjects,
	otherLanguages: otherLanguages,
	translationChecksum: createTranslationsChecksum( translationHashes )
};

module.exports = Controller;
