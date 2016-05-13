/* jshint node:true, es5: true */
/* jscs:disable */
var preq = require( 'preq' );
var BBPromise = require( 'bluebird' );
var fs = require( 'fs' );
var _ = require( 'underscore' );
var merge = require( 'deepmerge' );
var siteDefs = require( './site-defs.json' );
var syncRequest = require('sync-request');

var projectCodes = [
	'wikibooks',
	'wiktionary',
	'wiki',
	'wikinews',
	'wikiquote',
	'wikisource',
	'wikiversity',
	'wikivoyage'
];

var getSloganUrl = function( baseUrl ){
	if (baseUrl) {
		return baseUrl + "/w/api.php/w/api.php?action=query&format=json&prop=revisions&titles=MediaWiki%3ASitesubtitle&utf8=1&rvprop=content&rvlimit=1"
	} else {
		return false;
	}
};

function httpGet( url ) {
	var preqOptions = { headers: { 'User-Agent': 'Wikimedia portals updater' } };

	return preq.get( url, preqOptions )
		.then( function( request ) {
			return BBPromise.resolve( request.body );
		} )
		//JSHint throwing error on reserved .catch() statement
		/*jshint -W024 */
		.catch( function( err ) {
			/*jshint +W024 */
			// I can haz error message that makes sense?
			var msg = err.toString() + ' requesting ' + url;
			console.error( msg );
			BBPromise.reject( msg );
		} );
}

function getSiteMatrix() {
	return httpGet( 'https://meta.wikimedia.org/w/api.php?action=sitematrix&format=json&smtype=language&smlangprop=code%7Csite' );
}

var siteMatrixByLang = {};

function getTranslations() {
	return BBPromise.all( [ getSiteMatrix() ] )
		.then( function( data ) {

			var siteMatrix = data[0].sitematrix;
			var newSiteDefs;

			_.each( siteMatrix, function( lang, propName ) {
				if (!/^\d+$/.test(propName)) {
					return; // Not a language
				}
				siteMatrixByLang[lang.code] = {};

				_.each(lang.site, function (site) {
					if (site.closed === '' || !!site.name || site.code === 'beta' ) {
						return;
					}
					siteMatrixByLang[lang.code][site.code] = {
						siteName: site.sitename,
						url: site.url
					};
				});
			});

			newSiteDefs = merge( siteMatrixByLang, siteDefs );

			_.each( newSiteDefs, function( lang ) {
				_.each( lang, function( langProject, langPorjectKey ) {

					if ( projectCodes.indexOf( langPorjectKey ) >= 0
						&& !langProject.slogan
						&& getSloganUrl( langProject.url )
						) {

						var res = syncRequest( 'GET', getSloganUrl( langProject.url ),
							{'headers': {
									'user-agent': 'Wikimedia portals updater'
								}
							});

						var sloganResponse =  res.body.toString( 'utf-8' );

						var slogan = sloganResponse.match(/\*(.+\")/g);

						if ( slogan && slogan[ 0 ] ) {

							var sloganText = slogan[ 0 ];
							var sloganLength = sloganText.length -1;
							langProject.slogan = slogan[ 0 ].substring( 4, sloganLength );
							console.log( 'slogan:', langProject.slogan );
						}

					}

				} );
			} );


			fs.writeFileSync( 'new-site-defs.json', JSON.stringify( newSiteDefs,  null, "\t" ) );

		} );
}

getTranslations();
