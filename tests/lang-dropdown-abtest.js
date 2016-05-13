// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/* global casper, console */

/**
 * Integration Test for the followig wikipedia.org portal A/B test.
 * https://phabricator.wikimedia.org/T131526
 *
 * Run from the main project directory with
 * $ npm run lang-dropdown-abtest -- --url=http://your testing url
 *
 * Do not add a testing hash like '#language-detection-a' to the end of
 * the testing URL as that will disable event logging.
 *
 * This event-logging test does the following:
 * - opens the wikipedia portal
 * - sets the event logging group to 'lang_dropdown-b'
 * - sets a different browser language.
 * - reloads the page
 * - checks for a landing EL request
 * - checks for clickthrough events on all sections.
 * - checks for clickthrough event on forms.
 * - makes sure only 1 event per section was sent.
 *
 * Note: this test does not send any real event-logging requests.
 **/

var _ = require( 'underscore' );

casper.test.begin( 'Wikipedia Portal - abtest4', function suite( test ) {

	var portalUrl = casper.cli.get( 'url' );

	var abTestGroup = 'lang_dropdown-b';

	var browserLang = 'ar';

	var sessionId = false;

	var setLang;

	/**
	 * Tests which should be executed on event logging sections.
	 * These tests should trigger an EL request.
	 */
	var elTests = {
		clickEvent: function( section ) {
			test.assertExists( section.sectionSelector );
			casper.click( section.clickSelector );
		},
		submitEvent: function( section ){
			test.assertExists( section.sectionSelector );
			casper.fillSelectors( section.sectionSelector, section.formFields, false );
			casper.click( section.clickSelector );
		}
	};

	/**
	 * Sections to execute the event logging tests on.
	 * The names of these sections should equal the EL `section_used` || `event_type` property.
	 */
	var elSections = {
		landing: {
			eventTest: null,
			eventData: [],
			eventCount: 0
		},
		search: {
			eventTest: elTests.submitEvent,
			sectionSelector: '[data-el-section="search"]',
			clickSelector: '[data-el-section="search"] button[type="submit"]',
			eventCount: 0,
			eventData: [],
			formFields: {
				'input#hiddenLanguageInput': 'fr',
				'input#searchInput': '~paris'
			}
		},
		'primary links': {
			eventTest: elTests.clickEvent,
			sectionSelector: '[data-el-section="primary links"]',
			clickSelector: '[data-el-section="primary links"] * a',
			eventData: [],
			eventCount: 0
		},
		'secondary links': {
			eventTest: elTests.clickEvent,
			sectionSelector: '[data-el-section="secondary links"]',
			clickSelector: '[data-el-section="secondary links"] * a',
			eventData: [],
			eventCount: 0
		},
		'other languages': {
			eventTest: elTests.clickEvent,
			sectionSelector: '[data-el-section="other languages"]',
			clickSelector: '[data-el-section="other languages"] * a',
			eventData: [],
			eventCount: 0
		},
		'other projects': {
			eventTest: elTests.clickEvent,
			sectionSelector: '[data-el-section="other projects"]',
			clickSelector: '[data-el-section="other projects"] * a',
			eventData: [],
			eventCount: 0
		}
	};

	/**
	 * Parses url parameters
	 */
	function parseUrlParams( elUrl ) {
		var obj = decodeURIComponent( elUrl.replace( /.*\?/, '' ) );
		return JSON.parse( obj );
	}

	/**
	 * Executes on all network requests. If the request looks like an EL request,
	 * it stores the EL data and increases an iterator.
	 * Changes the URL of the EL request to prevent real EL requests from being logged.
	 * @param request
	 * @param networkRequest
	 */
	function saveELRequest( request, networkRequest ) {

		if ( request.url.match( 'event.gif' ) || request.url.match( '/beacon/' ) ) {
			casper.page.clearMemoryCache();

			var parsedRequest = parseUrlParams( request.url ),
				elSection = parsedRequest.event.section_used || parsedRequest.event.event_type ;

			elSections[ elSection ].eventCount += 1;
			elSections[ elSection ].eventData += decodeURIComponent( request.url );

			networkRequest.changeUrl( 'null.gif' );
		}
	}

	/**
	 * Opens URL and changes event-logging group to an a/b test group
	 */

	casper.start( portalUrl, function(){

		sessionId = casper.evaluate( function( sessionId, abTestGroup ) {

			var maxRuns =  window.wmTest.populationSize * 100;

			 for ( var i = 0; i <= maxRuns && !sessionId; i++ ) {
				 var randomSessionId = window.eventLoggingLite.generateRandomSessionId();
				 Math.seedrandom(randomSessionId);
				 if (window.wmTest.getTestGroup() === abTestGroup ) {
					 sessionId = randomSessionId;
				 }
			 }

			localStorage.setItem( 'portal_session_id', sessionId );

			return sessionId;

		}, sessionId, abTestGroup );
	} );


	/**
	 * Sets the navigator.language to 'ar'
	 */
	var langAndTestGroup;

	casper.on('page.initialized', function(){

		casper.log( 'setting navigator.languages to "'+browserLang+'"' );

		setLang = casper.evaluate(function( browserLang ) {
			(function(oldNav){
				var newNav = {};
				[].forEach.call(Object.getOwnPropertyNames(navigator), function(prop){
					if (prop === 'language') {
						Object.defineProperty(newNav, prop, {
							enumerable: false,
							configurable: false,
							writable: false,
							value: browserLang
						});
					} else {
						Object.defineProperty(newNav, prop, {
							enumerable: false,
							configurable: false,
							get: function(){
								return oldNav[prop];
							}
						});
					}
				});
				window.navigator = newNav;
			})(window.navigator);

			return browserLang;

		}, browserLang );

	});

	/**
	 * Reloads page and attaches request listener after 'baseline' group
	 * has been set.
	 */
	casper.then( function () {
		casper.on( 'resource.requested', saveELRequest );
		casper.reload( function () {
			casper.echo( 'reloaded page as "'+ abTestGroup + '" group' );
			casper.page.navigationLocked = true;
		} );
	} );

	casper.then(  function() {
		test.assertEquals( setLang, browserLang , "navigator.languages correctly set: " + setLang );
		test.assert( sessionId !== false, "test group is correctly set to: " + abTestGroup );
	});
	/**
	 * Iterates through each section and runs the tests against them.
	 */
	_.each( elSections, function( section ) {
		if ( section.eventTest ) {
			casper.then( section.eventTest.bind( null, section ) );
		}
	} );

	/**
	 * Tests if only one event was sent per section, outputs EL request event.
	 */
	casper.then( function() {
		_.each( elSections, function( section ) {
			test.assertEquals( section.eventCount, 1,
				'"' +_.findKey( elSections, section ) + '" section sent 1 event:' );
			console.log( section.eventData );
		} );

	} );

	casper.then(function(){
		casper.capture('screenshot.png');
	})

	casper.run( function() {
		test.done();
	} );

} );
