/* eslint-env node, es6 */
var Controller,
	glob = require( 'glob' ),
	otherProjects = require( './other-projects.json' ),
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

Controller = {
	preloadLinks: getPreloadLinks(),
	otherProjects: otherProjects,
	l10n
};

module.exports = Controller;
