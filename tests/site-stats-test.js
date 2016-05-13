var siteStats = require( '../data/site-stats' );

module.exports.testParseProjectString = function( test ) {
	var parseProjectString = siteStats.parseProjectString;

	test.equals( 'enwiki', parseProjectString( 'en' ) );
	test.equals( 'enwiki', parseProjectString( 'en.zero' ) );
	test.equals( 'enwiki', parseProjectString( 'en.m' ) );
	test.equals( 'enwikibooks', parseProjectString( 'en.m.b' ) );

	test.equals( 'foundationwiki', parseProjectString( 'm.f' ) );
	test.equals( 'foundationwiki', parseProjectString( 'f' ) );

	test.equals( 'commonswiki', parseProjectString( 'commons' ) );
	test.equals( 'commonswiki', parseProjectString( 'commons.m' ) );
	test.equals( 'commonswiki', parseProjectString( 'commons.m.m' ) );
	test.equals( 'commonswiki', parseProjectString( 'commons.m.zero' ) );

	test.done();
};
