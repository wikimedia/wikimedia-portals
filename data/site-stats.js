/* jshint node:true, es5: true */
/* jscs:disable */
var preq = require( 'preq' );
var BBPromise = require( 'bluebird' );
var moment = require( 'moment' );
var exec = require( 'child_process' ).exec;
var fs = require( 'fs' );
var _ = require( 'underscore' );

/**
 * Number of days to generate the stats over
 */
var DAYS = 7;

var codeMapping = {
	b: 'wikibooks',
	d: 'wiktionary',
	f: 'foundationwiki',
	m: '',
	mw: 'wiki',
	n: 'wikinews',
	q: 'wikiquote',
	s: 'wikisource',
	v: 'wikiversity',
	voy: 'wikivoyage',
	w: 'wiki',
	wd: 'wikidatawiki',
	zero: ''
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

function getPageCounts() {
	if ( process.env.MEDIAWIKI_DEPLOYMENT_DIR && false ) {
		// Production
		// TODO:
	} else {
		// Developer's machine
		return httpGet( 'https://tools.wmflabs.org/pagecounts/pagecounts.json' )
			.then( function( pagecounts ) {
				var stats = {};

				_.each( pagecounts, function( wiki, code ) {
					code = code.replace( /_/g, '-' );
					stats[code] = wiki.contentPages;
				} );
				return BBPromise.resolve( stats );
			} );
	}
}

function getSiteMatrix() {
	return httpGet( 'https://meta.wikimedia.org/w/api.php?action=sitematrix&format=json&smtype=language&smlangprop=code%7Csite&smsiteprop=url%7Cdbname%7Ccode' );
}

function parseProjectString( str ) {
	var parts = str
		.split( '.' )
		.filter( function( part ) {
			return part !== 'm' && part !== 'zero';
		} );

	var name = parts.shift();
	if (codeMapping[name] ) {
		return codeMapping[name];
	}

	if ( parts.length ) {
		if ( !codeMapping[ parts[0] ] ) {
			throw 'Cannot parse wiki ' + str;
		}
		name += codeMapping[ parts[0] ];
	} else {
		name += 'wiki';
	}
	if ( parts.length > 1 ) {
		throw 'Cannot parse wiki ' + str;
	}
	return name;
}

function generateFileList() {
	var day = moment.utc().startOf( 'day' );
	var list = [];

	for ( var d = 0; d < DAYS; d++ ) {
		day = day.subtract( 1, 'days' );
		var baseUrl = 'https://dumps.wikimedia.org/other/pageviews/' + day.format( 'YYYY/YYYY-MM' ) + '/';
		var baseName = 'projectviews-' + day.format( 'YYYYMMDD' );

		for ( var i = 0; i <= 23; i++ ) {
			var file = baseName + '-' + ( i < 10 ? '0' : '' ) + i.toString() + '0000';
			list.push( { file: file, url: baseUrl + file } );
		}
	}

	return list;
}

function garbageCollect() {
	exec( 'find cache -mtime +' + ( DAYS + 2 ) + ' -delete', function( error ) {
		if ( error ) {
			console.error( 'Error deleting old cached stats', error );
		}
	} );
}

function getViewsData() {
	var list = generateFileList();

	var stats = [];
	var promise = new BBPromise( function( resolve ) {
		resolve();
	} );

	if ( !fs.existsSync( 'cache' ) ) {
		fs.mkdirSync( 'cache' );
	}
	garbageCollect();

	// Go synchronously to avoid hitting throttling on the server
	_.each( list, function( hour ) {
		var fileName = 'cache/' + hour.file;
		var content;
		try {
			content = fs.readFileSync( fileName, { encoding: 'utf8' } );
			stats.push( content );
		} catch( ex ) {
			if ( !content ) {
				promise = promise.then( function() {
						return httpGet( hour.url )
							.then( function( text ) {
								if ( !text ) {
									return;
								}
								fs.writeFileSync( fileName, text );
								stats.push( text );
							} );
					}
				);
			}
		}
	} );

	return promise.then( function() {
		return BBPromise.resolve( stats );
	} );
}

function getProjectViews() {
	return getViewsData()
		.then( function( hourlies ) {
			var views = {};

			_.each( hourlies, function( hourly ) {
				if ( !hourly ) {
					return;
				}
				var lines = hourly.toString().split( '\n' );
				_.each( lines, function( line ) {
					var parts = line.split( /\s+-?\s*/ );
					var wiki = parseProjectString( parts[0] );
					views[wiki] = views[wiki] || 0;
					views[wiki] += parseInt( parts[1], 10 );
				} );
			} );
			if ( !views ) {
				// We permit some hourly files to fail to be downloaded, but all of them missing
				// is a sign of a problem
				return BBPromise.reject( 'No hourly project views file was successfully loaded' );
			}
			return BBPromise.resolve( views );
		} )
		.error( function() {} ); // Do nothing, last file can be being generated right now
}


function getSiteStats() {
	var stats = {};

	return BBPromise.all( [ getPageCounts(), getSiteMatrix(), getProjectViews() ] )
		.then( function( data ) {
			var counts = data[0];
			var siteMatrix = data[1].sitematrix;
			var views = data[2];

			_.each( siteMatrix, function( lang, propName ) {
				if ( !/^\d+$/.test( propName ) ) {
					return; // Not a language... Fuck, this API's output is ugly
				}
				_.each( lang.site, function( site ) {
					var dbname = site.dbname.replace( /_/g, '-' );
					stats[site.code] = stats[site.code] || {};
					stats[site.code][lang.code] = {
						url: site.url,
						numPages: counts[dbname] || 0,
						views: views[dbname] || 0,
						closed: site.closed !== undefined
					};
				} );
			} );

			return BBPromise.resolve( stats );
		} );

}

module.exports = {
	getSiteStats: getSiteStats,
	parseProjectString: parseProjectString
};
