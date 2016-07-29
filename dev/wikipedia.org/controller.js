/* globals require */
/* globals module, __dirname */
var _ = require( 'underscore' ),
	hbs = require( '../../hbs-helpers.global.js' ),
	fs = require( 'fs' ),
	stats = require( '../../data/stats' ),
	otherProjects = require( './other-projects.json' ),
	otherLanguages = require( './other-languages.json' ),
	crypto = require( 'crypto' ),
	exec = require( 'child_process' ).exec,
	top100000List,
	top100000Dropdown,
	Controller,
	cachebuster;

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
var translationPath = __dirname + '/assets/l10n/';

function createTranslationsChecksum( siteStats ) {
	var data = JSON.stringify( siteStats ),
		hash = crypto.createHash( 'md5' ).update( data ).digest( 'hex' );

	// truncating hash for legibility
	hash = hash.substring( 0, 8 );
	return hash;
}

function createTranslationFiles( translationPath, siteStats, cachebuster ) {

	var writeFile = function ( el, lang ) {

		if ( el.code ) {
			lang = el.code;
		}

		var fileName = translationPath + lang + '-' + cachebuster + '.json',
			fileContent = JSON.stringify( el );

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

cachebuster = createTranslationsChecksum( siteStats );

if ( fs.existsSync( translationPath ) ) {

	exec( 'find ' + translationPath + ' -name *.json -delete', function ( error ) {
		if ( error ) {
			throw error;
		} else {
			createTranslationFiles( translationPath, siteStats, cachebuster );
		}
	} );
} else {
	fs.mkdirSync( translationPath );
	createTranslationFiles( translationPath, siteStats, cachebuster );
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
	translationChecksum: cachebuster
};

module.exports = Controller;
