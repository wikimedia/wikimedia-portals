/* eslint-env node, es6 */
var _ = require( 'underscore' ),
	hbs = require( '../../hbs-helpers.global.js' ),
	fs = require( 'fs' ),
	glob = require( 'glob' ),
	stats = require( '../../data/stats' ),
	otherProjects = require( './other-projects.json' ),
	rtlLanguages = require( './rtl-languages.json' ),
	crypto = require( 'crypto' ),
	deleteFiles = require( '../../data/utils' ),
	top1000List,
	top1000Dropdown,
	Controller,
	cachebuster,
	siteStats,
	range,
	translationPath = __dirname + '/assets/l10n/',
	l10n = require( '../../l10n/en.json' ); // These will be global values
// This is specific to Wikibooks.
l10n.portal = l10n.wikibooks;

l10n.assets = {
	logo: {
		src: 'portal/wikibooks.org/assets/img/Wikibooks-logo-tiles_1x.png',
		srcset: 'portal/wikibooks.org/assets/img/Wikibooks-logo-tiles_1.5x.png 1.5x, portal/wikibooks.org/assets/img/Wikibooks-logo-tiles_2x.png 2x',
		width: '200',
		height: '183'
	},
	lang: {
		url: '//meta.wikimedia.org/wiki/List_of_Wikibooks'
	},
	search:
	{
		action: '//www.wikibooks.org/search-redirect.php'
	}
};

function getPreloadLinks() {
	var preloadLinks = [];
	[
		{
			pattern: 'portal/wikibooks.org/assets/img/sprite*.svg',
			as: 'image'
		}
	].forEach( function ( source ) {
		glob.sync( source.pattern, { cwd: __dirname } )
			.forEach( function ( href ) {
				preloadLinks.push( { href: href, as: source.as } );
			} );
	} );

	return preloadLinks;
}

// Format the dropdown for ./templates/search.mustache
top1000List = stats.getRange( 'wikibooks', 'numPages', 1000 );
top1000Dropdown = stats.format( 'wikibooks', top1000List, {
	stripTags: true
} );

/**
 *  SiteStats returns and object for each language wiktionary by language code.
 *  ex:
 *  "en":{"url":"en.wiktionary.org",
 *        "numPages":"5 077 000",
 *        "views":1723574042,
 *        "siteName":"Wiktionary",
 *        "articles":"articles",
 *        "slogan":"The Free Encyclopedia",
 *        "name":"English",
 *        "lang":"en"
 *        }
 */
siteStats = {};
range = stats.getRangeFormatted( 'wikibooks', 'views', 10 );

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
 *
 * @return {string}
 */
function createTranslationsChecksum() {
	var data = JSON.stringify( siteStats ),
		hash = crypto.createHash( 'md5' ).update( data ).digest( 'hex' );
	// Truncating hash for legibility
	hash = hash.substring( 0, 8 );
	return hash;
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

		fs.writeFileSync( fileName, fileContent );
	}

	for ( lang in siteStats ) {
		if ( siteStats[ lang ].sublinks ) {
			siteStats[ lang ].sublinks.forEach( writeFile );
		} else {
			writeFile( siteStats[ lang ], lang );
		}
	}
}

cachebuster = createTranslationsChecksum();

if ( fs.existsSync( translationPath ) ) {
	deleteFiles( translationPath, 1 );
} else {
	fs.mkdirSync( translationPath );
}
createTranslationFiles();

Controller = {
	top10views: stats.getTopFormatted( 'wikibooks', 'views', 10 ),
	top10000Articles: stats.getRangeFormatted( 'wikibooks', 'numPages', 10000, 100000 ),
	top1000Articles: stats.getRangeFormatted( 'wikibooks', 'numPages', 1000, 10000 ),
	top100Articles: stats.getRangeFormatted( 'wikibooks', 'numPages', 100, 1000 ),
	top1000Dropdown: top1000Dropdown,
	rtlLanguages: rtlLanguages,
	rtlLanguagesStringified: '[\'' + rtlLanguages.join( '\',\'' ) + '\']',
	translationChecksum: cachebuster,
	preloadLinks: getPreloadLinks(),
	otherProjects: otherProjects,
	l10n
};

module.exports = Controller;
