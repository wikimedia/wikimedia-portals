// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/*global mw, eventLoggingLite, getIso639 */

window.wmTest = ( function ( eventLoggingLite, mw ) {

	'use strict';
	var sessionId = eventLoggingLite.generateRandomSessionId(),
		pabTest3 = 'language-detection-b',
		controlGroup = 'language-detection-a',
		populationSize = 2, // population size for beta or dev
		group,
		sessionExpiration = 15 * 60 * 1000, // 15 minutes
		preferredLangs,
		KEYS = {
			GROUP: 'portal_test_group',
			SESSION_ID: 'portal_session_id',
			EXPIRES: 'portal_test_group_expires'
		},

	// You can allow a test-only mode (no eventlogging)
	// e.g: testOnly = (location.hash.slice( 1 ) === 'pab1')
		testOnly = location.hash.slice( 1 ) === pabTest3 || location.hash.slice( 1 ) === controlGroup;

	/**
	 * If we're on production, increase population size.
	 */
	if ( /www.wikipedia.org/.test( location.hostname ) ) {
		populationSize = 200;
	}

	/**
	 * Determines whether the user is part of the population size.
	 *
	 * @param {number} rand
	 * @param {number} populationSize
	 * @return {boolean}
	 */
	function oneIn( rand, populationSize ) {
		// take the first 52 bits of the rand value
		var parsed = parseInt( rand.slice( 0, 13 ), 16 );
		return parsed % populationSize === 0;
	}

	/**
	 * Puts the user in a population group randomly.
	 */
	function getTestGroup( sessionId ) {

		var group = 'rejected';
		// 1:populationSize of the people are tested (baseline)
		if ( oneIn( sessionId, populationSize ) ) {

			var groupIndex = Math.floor( Math.random() * ( 10 ) ) + 1;

			switch ( groupIndex ) {
				case 1:
					group = pabTest3;
					break;
				case 2:
					group = controlGroup;
					break;
				default:
					group = 'baseline';
			}
		}
		return group;
	}

	if ( testOnly ) {
		group = location.hash.slice( 1 );
	} else if ( window.localStorage && !/1|yes/.test( navigator.doNotTrack ) ) {
		var portalGroup = mw.storage.get( KEYS.GROUP ),
			portalSessionId = mw.storage.get( KEYS.SESSION_ID ),
			expires = mw.storage.get( KEYS.EXPIRES ),
			now = new Date().getTime();
		if ( expires &&
			portalSessionId &&
			portalGroup &&
			now < parseInt( expires, 10 )
		) {
			sessionId = portalSessionId;
			// Because localStorage will convert null to a string.
			group = portalGroup === 'null' ? null : portalGroup;
		} else {
			group = getTestGroup( sessionId );
			mw.storage.set( KEYS.SESSION_ID, sessionId );
			mw.storage.set( KEYS.GROUP, group );
		}
		// set or extend for 15 more minutes
		mw.storage.set( KEYS.EXPIRES, now + sessionExpiration );
	} else {
		group = 'rejected';
	}

	/**
	 * Created an array of preferred languages in ISO939 format.
	 *
	 * @return {Array} langs
	 */
	function setPreferredLanguages() {
		var langs = [];

		function appendLanguage( l ) {
			var lang = getIso639( l );
			if ( lang && langs.indexOf( lang ) < 0 ) {
				langs.push( lang );
			}
		}

		for ( var i in navigator.languages ) {
			appendLanguage( navigator.languages[ i ] );
		}

		appendLanguage( navigator.language );
		appendLanguage( navigator.userLanguage );
		appendLanguage( navigator.browserLanguage );
		appendLanguage( navigator.systemLanguage );

		return langs;
	}

	preferredLangs = setPreferredLanguages();

	return {
		loggingDisabled: testOnly, // for test

		/**
		 * User random session ID
		 *
		 * @type {string}
		 */
		sessionId: sessionId,

		/**
		 * The users preferred languages as inferred from
		 * their browser settings.
		 */
		userLangs: preferredLangs,

		/**
		 * User population group
		 *
		 * @type {string}
		 */
		group: group,

		/**
		 * the one in x population.
		 * @type {int}
		 */
		populationSize: populationSize,

		/**
		 * getTestGroup function exposed publicly for testing purposes.
		 */
		getTestGroup: getTestGroup

	};

}( eventLoggingLite, mw ) );
