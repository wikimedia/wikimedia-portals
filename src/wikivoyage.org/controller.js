/* eslint-env node, es6 */
var hbs = require( '../../hbs-helpers.global.js' ),
	fs = require( 'fs' ),
	glob = require( 'glob' ),
	stats = require( '../../data/stats' ),
	otherProjects = require( './other-projects.json' ),
	rtlLanguages = require( './rtl-languages.json' ),
	crypto = require( 'crypto' ),
	deleteFiles = require( '../../data/utils' ),
	searchLanguageWikis,
	searchLanguageDropdown,
	Controller,
	cachebuster,
	siteStats,
	range,
	translationPath = __dirname + '/assets/l10n/',
	l10n = require( '../../l10n/en.json' ); // These will be global values
// This is specific to Wikivoyage.
l10n.portal = l10n.wikivoyage;

l10n.assets = {
	family: 'wikivoyage',
	logo: {
		src: 'portal/wikivoyage.org/assets/img/Wikivoyage-logo-tiles_1x.png',
		srcset: 'portal/wikivoyage.org/assets/img/Wikivoyage-logo-tiles_1.5x.png 1.5x, portal/wikivoyage.org/assets/img/Wikivoyage-logo-tiles_2x.png 2x',
		width: '200',
		height: '200'
	},
	lang: {
		url: '//meta.wikimedia.org/wiki/Wikivoyage'
	}
};

function getPreloadLinks() {
	var preloadLinks = [];
	[
		{
			pattern: 'portal/wikivoyage.org/assets/img/sprite*.svg',
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
searchLanguageWikis = stats.getRange( 'wikivoyage', 'numPages', 1000 );
searchLanguageDropdown = stats.format( 'wikivoyage', searchLanguageWikis, {
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
range = stats.getRangeFormatted( 'wikivoyage', 'views', 10 );

range.forEach( function ( wiki ) {
	if ( wiki.closed || wiki.sublinks ) {
		return;
	}

	wiki.numPages = hbs.formatNumber( wiki.numPages, {
		hash: {
			thousandSeparator: true,
			rounded: true,
			nbsp: false,
			locale: wiki.lang
		}
	} ).toString();

	siteStats[ wiki.code ] = { ...wiki }; // Create a shallow copy to avoid modifying the parameter
	delete siteStats[ wiki.code ].closed;
	delete siteStats[ wiki.code ].code;
	delete siteStats[ wiki.code ].index;
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
	hash = hash.slice( 0, 8 );
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

		// eslint-disable-next-line security/detect-non-literal-fs-filename
		fs.writeFileSync( fileName, fileContent );
	}

	for ( lang in siteStats ) {
		if ( siteStats[ lang ].sublinks ) {
			siteStats[ lang ].sublinks.forEach( writeFile );
		} else if ( lang === 'zh' ) {
			const { variants, ...rest } = siteStats[ lang ];
			writeFile( variants[ 'zh-hans' ], 'zh-hans' );
			writeFile( variants[ 'zh-hant' ], 'zh-hant' );
			writeFile( rest, lang );
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
	top10views: stats.getTopFormatted( 'wikivoyage', 'views', 10 ),
	top10000Articles: stats.getRangeFormatted( 'wikivoyage', 'numPages', 10000, 100000 ),
	top1000Articles: stats.getRangeFormatted( 'wikivoyage', 'numPages', 1000, 10000 ),
	top100Articles: stats.getRangeFormatted( 'wikivoyage', 'numPages', 100, 1000 ),
	searchLanguageDropdown: searchLanguageDropdown,
	rtlLanguages: rtlLanguages,
	rtlLanguagesStringified: '[\'' + rtlLanguages.join( '\',\'' ) + '\']',
	translationChecksum: cachebuster,
	preloadLinks: getPreloadLinks(),
	otherProjects: otherProjects,
	l10n
};

module.exports = Controller;
