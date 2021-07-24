/* eslint-env node, es6 */
var _ = require( 'underscore' ),
	hbs = require( '../../hbs-helpers.global.js' ),
	Controller,
	glob = require( 'glob' ),
	stats = require( '../../data/stats' ),
	top100000List,
	top100000Dropdown,
	otherProjects = require( './other-projects.json' ),
	siteStats,
	range,
	rtlLanguages = require( './rtl-languages.json' ),
	l10n = require( '../../l10n/en.json' ); // These will be global values

// This is specific to Wiktionary.
l10n.portal = l10n.wiktionary;

l10n.assets = {
	logo: {
		src: 'portal/wiktionary.org/assets/img/Wiktionary-logo-tiles_1x.png',
		srcset: 'portal/wiktionary.org/assets/img/Wiktionary-logo-tiles_1.5x.png 1.5x, portal/wiktionary.org/assets/img/Wiktionary-logo-tiles_2x.png 2x',
		width: '200',
		height: '183'
	},
	lang: {
		url: '//meta.wikimedia.org/wiki/Wiktionary#List_of_Wiktionaries'
	},
	search:
	{
		action: '//www.wiktionary.org/search-redirect.php'
	}
};

function getPreloadLinks() {
	var preloadLinks = [];
	[
		{
			pattern: 'portal/wiktionary.org/assets/img/sprite*.svg',
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
top100000List = stats.getRange( 'wiktionary', 'numPages', 100000 );
top100000Dropdown = stats.format( 'wiktionary', top100000List, {
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

Controller = {
	top10views: stats.getTopFormatted( 'wiktionary', 'views', 10 ),
	top1000000Articles: stats.getRangeFormatted( 'wiktionary', 'numPages', 1000000 ),
	top100000Articles: stats.getRangeFormatted( 'wiktionary', 'numPages', 100000, 1000000 ),
	top10000Articles: stats.getRangeFormatted( 'wiktionary', 'numPages', 10000, 100000 ),
	top1000Articles: stats.getRangeFormatted( 'wiktionary', 'numPages', 1000, 10000 ),
	top100Articles: stats.getRangeFormatted( 'wiktionary', 'numPages', 100, 1000 ),
	top100000Dropdown: top100000Dropdown,
	rtlLanguages: rtlLanguages,
	rtlLanguagesStringified: '[\'' + rtlLanguages.join( '\',\'' ) + '\']',
	preloadLinks: getPreloadLinks(),
	otherProjects: otherProjects,
	l10n
};

module.exports = Controller;
