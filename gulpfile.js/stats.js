var siteStats = require( '../data/site-stats' ),
	fs = require( 'fs' );

function updateStats() {

	return siteStats.getSiteStats().then( function ( stats ) {
		fs.writeFileSync( './data/site-stats.json', JSON.stringify( stats, null, '\t' ) );
	} );
}

exports.updateStats = updateStats;
