// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/* global casper, console */

/**
 * This test simulates how event-logging bucketing works
 * on a large userbase by opening the portal page
 * and running the event-logging bucketing scripts thousands
 * of times. No event-logging data is sent with this test.
 *
 * Run with:
 * $ npm run elbucketing -- --url=http://your testing url
 *
 * note: the 'oneIn' variable that selects users for EL is
 * different for testing than in production.
 */

var _ = require( 'underscore' );

casper.test.begin( 'Wikipedia Portal - baseline', function suite( test ) {

	var portalUrl = casper.cli.get( 'url' );
	var wmTest;
	var oneIn;
	var buckets = [];

	casper.start( portalUrl, function() {

		wmTest = this.getGlobal( 'wmTest' );

		var totalPopulation = 10000;

		oneIn = this.evaluate( function( ) {
			return wmTest.populationSize;
		} );

		for ( var i = 0; i < totalPopulation; i++ ) {

			buckets.push(
				this.evaluate( function( sessionId ) {
					var sessionId = eventLoggingLite.generateRandomSessionId();
					return wmTest.getTestGroup( sessionId );
				} )
			);
		}

		var b = _.countBy( buckets, function( n ) {
			return n;
		} );

		var c = _.mapObject( b, function( val, key ) {
			return {
				absolute: val,
				relative: ( ( val / totalPopulation ) * 100 ).toFixed( 2 )
			};
		});

		casper.echo( ' ' );
		casper.echo( '=============== Configuration ===============' );
		casper.echo( 'Total population: ' + totalPopulation  );
		casper.echo( 'One in ' + oneIn + ' people selected for event logging.');
		casper.echo( ' ' );

		var eventLoggingAbsolute = totalPopulation - c.rejected.absolute;

		casper.echo( '===============    Results    ===============' );
		casper.echo( 'Total population:' + totalPopulation );
		casper.echo( ' ' );
		casper.echo( '[Rejected] group: ' + c.rejected.absolute + ' (' + c.rejected.relative + ' % of total population)');
		casper.echo( '[Event Logging] group: ' + eventLoggingAbsolute + ' (' + (100 - c.rejected.relative) + ' % of total population)');
		casper.echo( ' ' );


		function logBucket(name, absolute, relativeToTotal, relativeToEL) {
			//casper.echo( name + ': ' + (absolute) + ' (' + (relativeToTotal) + ' % of total population) (' + relativeToEL + ' % of event logging group)');
			casper.echo( '[' + name + ']');
			casper.echo(': ' + (absolute) + ' people');
			casper.echo(': ' + (relativeToTotal) + ' % of total population');
			casper.echo(': ' + relativeToEL + ' % of event logging group');
			casper.echo( ' ' );
		}

		var baseline = c['baseline'];
		delete c.rejected;
		delete c['baseline'];
		var baseLineELRelative = ( ( baseline.absolute / eventLoggingAbsolute ) * 100 ).toFixed( 2 );

		casper.echo( '==========  Event Logging buckets  ==========' );
		logBucket('baseline', baseline.absolute, baseline.relative, baseLineELRelative);

		_.each( c, function( val, key ) {
			var eventLoggingRelative = ( ( val.absolute / eventLoggingAbsolute ) * 100 ).toFixed( 2 );
			logBucket(key, val.absolute, val.relative, eventLoggingRelative);
		});
		casper.echo( ' ' );
		test.assertEquals( true, true );

	} );

	casper.run( function () {
		test.done();
	} );

} );
