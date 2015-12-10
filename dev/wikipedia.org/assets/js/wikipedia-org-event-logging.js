// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/* global eventLoggingLite */
/* global wmTest */

( function ( eventLoggingLite, wmTest ) {

	'use strict';

	var portalSchema, eventSections, docForms,
	geoCookie = document.cookie.match( /GeoIP=.[^:]/ );

	if ( wmTest.group === 'rejected' || wmTest.loggingDisabled ) {
		return;
	}

	portalSchema = {
		name: 'WikipediaPortal',
		// revision # from https://meta.wikimedia.org/wiki/Schema:WikipediaPortal
		revision: 14377354,
		defaults: {
			session_id: wmTest.sessionId,
			event_type: 'landing',
			referer: document.referrer || null,
			accept_language: ( navigator && navigator.language ) ? navigator.language : navigator.browserLanguage,
			cohort: wmTest.group
		},
		properties: {
			session_id: {
				type: 'string',
				required: true
			},
			event_type: {
				type: 'string',
				required: true,
				'enum': [
					'landing',
					'clickthrough'
				]
			},
			section_used: {
				type: 'string',
				required: false,
				'enum': [
					'primary links',
					'search',
					'language search',
					'secondary links',
					'other languages',
					'other projects'
				]
			},
			destination: {
				type: 'string',
				required: false
			},
			referer: {
				type: 'string',
				required: false
			},
			country: {
				type: 'string',
				required: false
			},
			accept_language: {
				type: 'string',
				required: true
			},
			cohort: {
				type: 'string',
				required: false
			}
		}
	};

	eventSections = [
		{ name: 'primary links',   nodes: document.querySelectorAll( '.central-featured' ) },
		{ name: 'search',          nodes: document.querySelectorAll( '.search-form' ) },
		{ name: 'language search', nodes: document.querySelectorAll( '.language-search' ) },
		{ name: 'secondary links', nodes: document.querySelectorAll( '.langlist' ) },
		{ name: 'other languages', nodes: document.querySelectorAll( '#langlist-other' ) },
		{ name: 'other projects',  nodes: document.querySelectorAll( '.otherprojects' ) }
	];

	/**
	 * Finds the section of the page the user interacted with based on
	 * a DOM element. Returns the name of the section.
	 *
	 * @param {Element} clickNode - DOM element.
	 * @param {Array} eventSections - Array of objects describing the DOM sections.
	 * @returns {string} - the name of the section the contains the clickNode.
	 */
	function findEventSection( clickNode, eventSections ) {

		var eventSection = {},
			i, j;

		for ( i = 0; i < eventSections.length; i++ ) {

			var nodes = eventSections[ i ].nodes;

			for ( j = 0; j < nodes.length; j++ ) {

				if (  nodes[ j ].contains( clickNode ) ) {

					eventSection = eventSections[ i ];
				}
			}
		}
		return eventSection.name;
	}

	/**
	 * Recursively checks if the parent element of a specified element
	 * is an anchor (<a>) element. Used in case a click event is triggered by
	 * the child of an anchor element, in order to retrieve that parent
	 * anchor. Ex: <a><strong>clicked here</strong></a> returns <a> element.
	 *
	 * @param {Element} el - Element to check for parent anchor.
	 * @returns {Element} - parent anchor element.
	 */
	function checkForParentAnchor( el ) {

		if ( el.tagName !== 'A' && el.parentElement ) {
			return checkForParentAnchor( el.parentElement );
		} else {
			return el;
		}
	}

	/**
	 * Window load event handler. Logs a 'landing' event when someone enters the page
	 */
	function interceptLandingEvent() {

		var eventData = {
			event_type: 'landing'
		};
		eventLoggingLite.logEvent( portalSchema, eventData );
	}

	/**
	 * Document click event handler. Intercepts all document click events and checks
	 * if they are an <a> matching an event section. If so, logs an event that user
	 * has interacted with a specific section.
	 */
	function interceptClick() {

		var anchor,
			event = window.event,
			target = event.target || event.srcElement;

		if ( target.matches( 'a, a *' ) ) {

			anchor = checkForParentAnchor( target );

			var eventData = {
				event_type: 'clickthrough',
				destination: anchor.href,
				section_used: findEventSection( anchor, eventSections )
			};

			if ( eventData.section_used ) {
				eventLoggingLite.logEvent( portalSchema, eventData );
			}
		}
	}

	/**
	 * Form submission event handler. Checks if a form belongs to an event section
	 * and logs an event when user has submitted it.
	 */
	function interceptForm() {

		var event = window.event,
			target = event.target || event.srcElement,
			eventData = {
			event_type: 'clickthrough',
			section_used: findEventSection( target, eventSections ),
			destination: target.action
		};

		if ( eventData.section_used ) {
			eventLoggingLite.logEvent( portalSchema, eventData );
		}

	}

	/**
	 * adding event listeners to DOM load, document click, and forms
	 */
	document.addEventListener( 'click', interceptClick );

	docForms =  document.getElementsByTagName( 'form' );

	for ( var i = 0; i < docForms.length; i++ ) {
		docForms[ i ].addEventListener( 'submit', interceptForm );
	}

	/**
	 * loading geoIP and sending landing event.
	 */

	if ( geoCookie ) {

		var cachedCC = geoCookie.toString().split( '=' )[ 1 ];

		portalSchema.defaults.country = cachedCC;
	}

	window.addEventListener( 'load', interceptLandingEvent );

	/**
	 * setting portal session cookie
	 */
	if ( !/1|yes/.test( navigator.doNotTrack ) ) {
		document.cookie = 'portal_user_id=' + portalSchema.defaults.session_id;
	}

}( eventLoggingLite, wmTest ) );
