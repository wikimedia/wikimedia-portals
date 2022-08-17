var argv = require( 'yargs' ).argv,
	portalParam = argv.portal,
	preq = require( 'preq' ),
	fs = require( 'fs' );

const { requirePortalParam } = require( './config' );

function fetchMeta() {

	var portalsFromMeta,
		portalRequest,
		portalRequests = [];

	requirePortalParam();

	if ( [ 'wikipedia.org', 'wiktionary.org', 'wikibooks.org', 'wikiquote.org', 'wikinews.org' ].includes( portalParam ) ) {
		console.log( 'Cannot override ' + portalParam + ' portal using fetch-meta.' );
		return process.exit( 1 );
	}

	if ( portalParam === 'all' ) {
		portalsFromMeta = [ 'wikimedia.org', 'wikiversity.org', 'wikivoyage.org' ];

		portalsFromMeta.forEach( function ( wiki ) {
			var request = preq.get( 'https://meta.wikimedia.org/w/index.php?title=Www.' + wiki + '_template&action=raw' )
				.then( function ( response ) {
					fs.mkdirSync( 'prod/' + wiki, { recursive: true } );
					return fs.writeFileSync( 'prod/' + wiki + '/index.html', response.body, 'utf8' );
				} );
			portalRequests.push( request );
		} );
	} else {
		portalRequest = preq.get( 'https://meta.wikimedia.org/w/index.php?title=Www.' + portalParam + '_template&action=raw' )
			.then( function ( response ) {
				fs.mkdirSync( 'prod/' + portalParam, { recursive: true } );
				return fs.writeFileSync( 'prod/' + portalParam + '/index.html', response.body, 'utf8' );
			} );
		portalRequests.push( portalRequest );
	}

	return Promise.all( portalRequests );
}

exports.fetchMeta = fetchMeta;
