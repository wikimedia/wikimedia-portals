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

// This is specific to Wikipedia.
l10n.portal = l10n.wiki;

l10n.assets = {
	family: 'wikipedia',
	logo: {
		src: 'portal/wikipedia.org/assets/img/Wikipedia-logo-v2.png',
		srcset: 'portal/wikipedia.org/assets/img/Wikipedia-logo-v2@1.5x.png 1.5x, portal/wikipedia.org/assets/img/Wikipedia-logo-v2@2x.png 2x',
		width: '200',
		height: '183'
	},
	videoLogo: {
		sneakpeek: {
			srcDark200: 'portal/wikipedia.org/assets/img/sneakpeek-dark-200x200.webm',
			srcDark300: 'portal/wikipedia.org/assets/img/sneakpeek-dark-300x300.webm',
			srcLight200: 'portal/wikipedia.org/assets/img/sneakpeek-light-200x200.webm',
			srcLight300: 'portal/wikipedia.org/assets/img/sneakpeek-light-300x300.webm'
		},
		balloons: {
			srcDark200: 'portal/wikipedia.org/assets/img/balloons-dark-200x200.webm',
			srcDark300: 'portal/wikipedia.org/assets/img/balloons-dark-300x300.webm',
			srcLight200: 'portal/wikipedia.org/assets/img/balloons-light-200x200.webm',
			srcLight300: 'portal/wikipedia.org/assets/img/balloons-light-300x300.webm'
		}
	},
	lang: {
		url: 'https://meta.wikimedia.org/wiki/Special:MyLanguage/List_of_Wikipedias'
	}
};

// Format the dropdown for ./templates/search.mustache
searchLanguageWikis = stats.getRange( 'wiki', 'numPages', 100000 );
searchLanguageDropdown = stats.format( 'wiki', searchLanguageWikis, {
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
siteStats = {};
range = stats.getRangeFormatted( 'wiki', 'views', 10 );

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

function getPreloadLinks() {
	const preloadLinks = [];
	[
		{
			pattern: 'portal/wikipedia.org/assets/img/sprite*.svg',
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
	top10views: stats.getTopFormatted( 'wiki', 'views', 10 ),
	top1000000Articles: stats.getRangeFormatted( 'wiki', 'numPages', 1000000 ),
	top100000Articles: stats.getRangeFormatted( 'wiki', 'numPages', 100000, 1000000 ),
	top10000Articles: stats.getRangeFormatted( 'wiki', 'numPages', 10000, 100000 ),
	top1000Articles: stats.getRangeFormatted( 'wiki', 'numPages', 1000, 10000 ),
	top100Articles: stats.getRangeFormatted( 'wiki', 'numPages', 100, 1000 ),
	searchLanguageDropdown: searchLanguageDropdown,
	preloadLinks: getPreloadLinks(),
	otherProjects: otherProjects,
	rtlLanguages: rtlLanguages,
	// The only "advantage" to do this instead of JSON.stringify is to get single quotes.
	rtlLanguagesStringified: '[\'' + rtlLanguages.join( '\',\'' ) + '\']',
	translationChecksum: cachebuster,
	l10n
};

module.exports = Controller;
