'use strict';

let hbs = require( '../../hbs-helpers.global.js' ),
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
// This is specific to Wiktionary.
l10n.portal = l10n.wiktionary;

l10n.assets = {
	family: 'wiktionary',
	logo: {
		src: 'portal/wiktionary.org/assets/img/Wiktionary-logo-tiles_1x.png',
		srcset: 'portal/wiktionary.org/assets/img/Wiktionary-logo-tiles_1.5x.png 1.5x, portal/wiktionary.org/assets/img/Wiktionary-logo-tiles_2x.png 2x',
		width: '200',
		height: '183'
	},
	lang: {
		url: '//meta.wikimedia.org/wiki/Wiktionary#List_of_Wiktionaries'
	}
};

function getPreloadLinks() {
	const preloadLinks = [];
	[
		{
			pattern: 'portal/wiktionary.org/assets/img/sprite*.svg',
			as: 'image'
		}
	].forEach( ( source ) => {
		glob.sync( source.pattern, { cwd: __dirname } )
			.forEach( ( href ) => {
				preloadLinks.push( { href: href, as: source.as } );
			} );
	} );

	return preloadLinks;
}

// Format the dropdown for ./templates/search.mustache
searchLanguageWikis = stats.getRange( 'wiktionary', 'numPages', 100000 );
searchLanguageDropdown = stats.format( 'wiktionary', searchLanguageWikis, {
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
range = stats.getRangeFormatted( 'wiktionary', 'views', 10 );

range.forEach( ( wiki ) => {
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
	let data = JSON.stringify( siteStats ),
		hash = crypto.createHash( 'md5' ).update( data ).digest( 'hex' );
	// Truncating hash for legibility
	hash = hash.slice( 0, 8 );
	return hash;
}

function createTranslationFiles() {
	let fileName, lang;

	function writeFile( el, langCode ) {
		let fileContent;

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
	top10views: stats.getTopFormatted( 'wiktionary', 'views', 10 ),
	top1000000Articles: stats.getRangeFormatted( 'wiktionary', 'numPages', 1000000 ),
	top100000Articles: stats.getRangeFormatted( 'wiktionary', 'numPages', 100000, 1000000 ),
	top10000Articles: stats.getRangeFormatted( 'wiktionary', 'numPages', 10000, 100000 ),
	top1000Articles: stats.getRangeFormatted( 'wiktionary', 'numPages', 1000, 10000 ),
	top100Articles: stats.getRangeFormatted( 'wiktionary', 'numPages', 100, 1000 ),
	searchLanguageDropdown: searchLanguageDropdown,
	rtlLanguages: rtlLanguages,
	rtlLanguagesStringified: '[\'' + rtlLanguages.join( '\',\'' ) + '\']',
	translationChecksum: cachebuster,
	preloadLinks: getPreloadLinks(),
	otherProjects: otherProjects,
	l10n
};

module.exports = Controller;
