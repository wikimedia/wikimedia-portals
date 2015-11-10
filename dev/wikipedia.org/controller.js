/* globals require */
/* globals module */
var stats = require( '../../stats' ),
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
