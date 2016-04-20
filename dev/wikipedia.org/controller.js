/* globals require */
/* globals module */
var _ = require( 'underscore' ),
	hbs = require( '../../hbs-helpers.global.js' ),
	fs = require( 'fs' ),
	stats = require( '../../stats' ),
	otherProjects = require( './other-projects.json' ),
	otherLanguages = require( './other-languages.json' ),
	top100000List,
	top100000Dropdown,
	Controller;

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
	if ( wiki.closed ) {
		return;
	}
	wiki.numPages = hbs.formatNumber( wiki.numPages, {
		hash: {
			thousandSeparator: true,
			thousandFloor: true,
			nbsp: false
		}
	} ).toString();
	siteStats[ wiki.code ] = _.omit( wiki, 'closed', 'code', 'index' );
} );

var fileName = './dev/wikipedia.org/site-defs.js';
fs.writeFileSync( fileName, '/* jshint ignore:start */\n/* jscs:disable */\nwmStats = ' + JSON.stringify( siteStats ) );

Controller = {
	top10views: stats.getTopFormatted( 'wiki', 'views', 10 ),
	top1000000Articles: stats.getRangeFormatted( 'wiki', 'numPages', 1000000 ),
	top100000Articles: stats.getRangeFormatted( 'wiki', 'numPages', 100000, 1000000 ),
	top10000Articles: stats.getRangeFormatted( 'wiki', 'numPages', 10000, 100000 ),
	top1000Articles: stats.getRangeFormatted( 'wiki', 'numPages', 1000, 10000 ),
	top100Articles: stats.getRangeFormatted( 'wiki', 'numPages', 100, 1000 ),
	top100000Dropdown: top100000Dropdown,
	otherProjects: otherProjects,
	otherLanguages: otherLanguages
};

module.exports = Controller;
