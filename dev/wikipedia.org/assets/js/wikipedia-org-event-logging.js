/* eslint camelcase: ["error", {properties: "never"}] */
/* global eventLoggingLite, wmTest, addEvent */

( function ( eventLoggingLite, wmTest ) {

	'use strict';

	var portalSchema, eventSections, docForms, eventData,
		geoCookie = document.cookie.match( /GeoIP=.[^:]/ );

	if ( wmTest.group === 'rejected' || wmTest.loggingDisabled ) {
		return;
	}

	portalSchema = {
		name: 'WikipediaPortal',
		// revision # from https://meta.wikimedia.org/wiki/Schema:WikipediaPortal
		revision: 15890769,
		defaults: {
			session_id: wmTest.sessionId,
			event_type: 'landing',
			referer: document.referrer || null,
			accept_language: wmTest.userLangs.toString(),
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
					'clickthrough',
					'select-language'
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
			},
			selected_language: {
				type: 'string',
				required: false
			}
		}
	};

	/* eslint-disable no-multi-spaces */
	eventSections = [
		{ name: 'primary links',   nodes: document.querySelectorAll( '[data-el-section="primary links"]' ) },
		{ name: 'search',          nodes: document.querySelectorAll( '[data-el-section="search"]' ) },
		{ name: 'language search', nodes: document.querySelectorAll( '[data-el-section="language search"]' ) },
		{ name: 'secondary links', nodes: document.querySelectorAll( '[data-el-section="secondary links"]' ) },
		{ name: 'other languages', nodes: document.querySelectorAll( '[data-el-section="other languages"]' ) },
		{ name: 'other projects',  nodes: document.querySelectorAll( '[data-el-section="other projects"]' ) }
	];
	/* eslint-enable no-multi-spaces */

	/**
	 * Finds the section of the page the user interacted with based on
	 * a DOM element. Returns the name of the section.
	 *
	 * @param {HTMLElement} clickNode The DOM element.
	 * @param {Array} eventSections List of objects describing the DOM sections.
	 * @return {string} The name of the section the contains the clickNode.
	 */
	function findEventSection( clickNode, eventSections ) {

		var eventSection = {},
			i, j;

		for ( i = 0; i < eventSections.length; i++ ) {

			var nodes = eventSections[ i ].nodes;

			for ( j = 0; j < nodes.length; j++ ) {

				if ( nodes[ j ].contains( clickNode ) ) {

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
	 * @param {HTMLElement} el Element to check for parent anchor.
	 * @return {HTMLElement} Parent anchor element.
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
		eventData = {
			event_type: 'landing'
		};
		eventLoggingLite.logEvent( portalSchema, eventData );

		// clearing event data after logging event.
		eventData = null;

	}

	/**
	 * Document click event handler. Intercepts all document click events and checks
	 * if they are an <a> matching an event section. If so, logs an event that user
	 * has interacted with a specific section.
	 *
	 * @param {Event} e
	 */
	function interceptClick( e ) {

		var anchor,
			event = e || window.event,
			target = event.target || event.srcElement;

		if ( target.matches( 'a, a *' ) ) {

			anchor = checkForParentAnchor( target );

			eventData = {
				event_type: 'clickthrough',
				destination: anchor.href,
				section_used: findEventSection( anchor, eventSections )
			};

			if ( eventData.section_used === 'search' ) {
				eventData.selected_language = document.getElementById( 'searchLanguage' ).options[ document.getElementById( 'searchLanguage' ).selectedIndex ].lang;
			}

			if ( eventData.section_used ) {
				eventLoggingLite.logEvent( portalSchema, eventData );
			}
		}

	}

	/**
	 * Document change event handler. Intercepts all document change events (e.g.
	 * search box's language selector.
	 *
	 * @param {Event} e
	 */
	function interceptChange( e ) {
		var event = e || window.event,
			target = event.target || event.srcElement;

		if ( target.id === 'searchLanguage' ) {

			if ( target.selectedIndex === -1 ) {
				return;
			}

			eventData = {
				event_type: 'select-language',
				selected_language: target.options[ target.selectedIndex ].lang
			};

			if ( eventData.selected_language ) {
				eventLoggingLite.logEvent( portalSchema, eventData );
			}

		}
	}

	/**
	 * Form submission event handler. Checks if a form belongs to an event section
	 * and logs an event when user has submitted it.
	 *
	 * @param {Event} e
	 */
	function interceptForm( e ) {
		var event = e || window.event,
			target = event.target || event.srcElement;

		if ( eventData === null ) {
			eventData = {
				event_type: 'clickthrough',
				section_used: findEventSection( target, eventSections ),
				destination: target.action
			};
		}

		if ( eventData.section_used === 'search' ) {
			eventData.selected_language = document.getElementById( 'searchLanguage' ).options[ document.getElementById( 'searchLanguage' ).selectedIndex ].lang;
		}

		if ( eventData.section_used ) {
			eventLoggingLite.logEvent( portalSchema, eventData );
		}
	}

	/**
	 * adding event listeners to DOM load, document click, and forms
	 */
	addEvent( document, 'click', interceptClick );
	addEvent( document, 'change', interceptChange );

	docForms = document.getElementsByTagName( 'form' );

	for ( var i = 0; i < docForms.length; i++ ) {
		addEvent( docForms[ i ], 'submit', interceptForm );
	}

	/**
	 * loading geoIP and sending landing event.
	 */

	if ( geoCookie ) {
		var country = geoCookie.toString().split( '=' )[ 1 ];
		if ( country === 'US' ) {
			/**
			 * if the country is United States, we need to obain the 2-letter state name (T136257)
			 * e.g. "GeoIP=US:CA:..." becomes "US:CA" using a slight modification to the regex:
			 */
			portalSchema.defaults.country = document.cookie.match( /GeoIP=.[^:].{2}[^:]/ ).toString().split( '=' )[ 1 ];
		} else {
			portalSchema.defaults.country = country;
		}
		addEvent( window, 'load', interceptLandingEvent );
	}

	addEvent( window, 'load', interceptLandingEvent );

}( eventLoggingLite, wmTest ) );
