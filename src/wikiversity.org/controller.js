'use strict';

const hbs = require( '../../hbs-helpers.global.js' ),
	fs = require( 'fs' ),
	glob = require( 'glob' ),
	stats = require( '../../data/stats' ),
	otherProjects = require( './other-projects.json' ),
	rtlLanguages = require( './rtl-languages.json' ),
	crypto = require( 'crypto' ),
	deleteFiles = require( '../../data/utils' ),
	translationPath = __dirname + '/assets/l10n/',
	l10n = require( '../../l10n/en.json' ); // These will be global values
let cachebuster = null;

// This is specific to Wikiversity.
l10n.portal = l10n.wikiversity;

l10n.assets = {
	family: 'wikiversity',
	logo: {
		src: 'portal/wikiversity.org/assets/img/Wikiversity-logo-tiles_1x.png',
		srcset: 'portal/wikiversity.org/assets/img/Wikiversity-logo-tiles_1.5x.png 1.5x, portal/wikiversity.org/assets/img/Wikiversity-logo-tiles_2x.png 2x',
		width: '200',
		height: '164'
	},
	lang: {
		url: '//meta.wikimedia.org/wiki/Wikiversity'
	}
};

function getPreloadLinks() {
	const preloadLinks = [];
	[
		{
			pattern: 'portal/wikiversity.org/assets/img/sprite*.svg',
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
const searchLanguageWikis = stats.getRange( 'wikiversity', 'numPages', 1000 );
const searchLanguageDropdown = stats.format( 'wikiversity', searchLanguageWikis, {
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
const siteStats = {};
const range = stats.getRangeFormatted( 'wikiversity', 'views', 10 );

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
	const data = JSON.stringify( siteStats );
	// Truncating hash for legibility
	return crypto.createHash( 'md5' ).update( data ).digest( 'hex' ).slice( 0, 8 );
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

	for ( const lang in siteStats ) {
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

const Controller = {
	top10views: stats.getTopFormatted( 'wikiversity', 'views', 10 ),
	top10000Articles: stats.getRangeFormatted( 'wikiversity', 'numPages', 10000, 100000 ),
	top1000Articles: stats.getRangeFormatted( 'wikiversity', 'numPages', 1000, 10000 ),
	top100Articles: stats.getRangeFormatted( 'wikiversity', 'numPages', 100, 1000 ),
	searchLanguageDropdown: searchLanguageDropdown,
	rtlLanguages: rtlLanguages,
	rtlLanguagesStringified: '[\'' + rtlLanguages.join( '\',\'' ) + '\']',
	translationChecksum: cachebuster,
	preloadLinks: getPreloadLinks(),
	otherProjects: otherProjects,
	l10n
};

module.exports = Controller;
