/* global eventLoggingLite, getIso639 */

window.wmTest = ( function ( eventLoggingLite, mw ) {

	var bucketParams = {
			// population for prod or dev
			popSize: ( /www.wikipedia.org/.test( location.hostname ) ) ? 200 : 2,
			// testGroups can be set to `false` if there's no test. else {control: 'name-of-control-group', test: 'name-of-test-group'}
			testGroups: false,
			// set to 15 minutes
			sessionLength: 15 * 60 * 1000
		},
		// localstorage keys
		KEYS = {
			GROUP: 'portal_test_group',
			SESSION_ID: 'portal_session_id',
			EXPIRES: 'portal_test_group_expires'
		},
		preferredLangs, sessionId, group, testOnly;

	/**
	 * Created an array of preferred languages in ISO939 format.
	 *
	 * @return {Array} langs
	 */
	function setPreferredLanguages() {
		var langs = [], possibleLanguage, i;

		function appendLanguage( l ) {
			var lang = getIso639( l );
			if ( lang && langs.indexOf( lang ) < 0 ) {
				langs.push( lang );
			}
		}

		for ( i in navigator.languages ) {
			appendLanguage( navigator.languages[ i ] );
		}

		// gets browser languages from some old Android devices
		if ( /Android/i.test( navigator.userAgent ) ) {
			possibleLanguage = navigator.userAgent.split( ';' );
			if ( possibleLanguage[ 3 ] ) {
				appendLanguage( possibleLanguage[ 3 ].trim() );
			}
		}

		appendLanguage( navigator.language );
		appendLanguage( navigator.userLanguage );
		appendLanguage( navigator.browserLanguage );
		appendLanguage( navigator.systemLanguage );

		return langs;
	}

	preferredLangs = setPreferredLanguages();

	/**
	 * Determines whether the user is part of the population size.
	 *
	 * @param {number} populationSize
	 * @return {boolean}
	 */
	function oneIn( populationSize ) {
		return ( Math.floor( ( Math.seededrandom() * populationSize ) + 1 ) ) === 1;
	}

	/**
	 * Puts the user in a population group randomly.
	 *
	 * @return {string}
	 */
	function getTestGroup() {

		var group = 'rejected';
		// 1:populationSize of the people are tested (baseline)
		if ( oneIn( bucketParams.popSize ) ) {
			group = 'baseline';

			if ( bucketParams.testGroups && bucketParams.testGroups.test && oneIn( 10 ) ) {
				if ( oneIn( 2 ) ) {
					group = bucketParams.testGroups.test;
				} else {
					group = bucketParams.testGroups.control;
				}
			}
		}

		return group;
	}

	/**
	 * Returns a locally stored session ID or generates a new one.
	 * Returns false if browser doesn't support local storage.
	 *
	 * @returns {boolean}
	 */
	function getSessionId() {

		var sessionId = false,
			storedSessionId,
			expires,
			now;

		if ( window.localStorage && !/1|yes/.test( navigator.doNotTrack ) ) {

			storedSessionId = mw.storage.get( KEYS.SESSION_ID );
			expires = mw.storage.get( KEYS.EXPIRES );
			now = new Date().getTime();

			// return storedSessionId if not expired
			if ( storedSessionId && expires > parseInt( now, 10 ) ) {
				sessionId = storedSessionId;
			} else {
				// or create new sessionID
				sessionId = eventLoggingLite.generateRandomSessionId();
				mw.storage.set( KEYS.SESSION_ID, sessionId );
			}

			// set or extend sessionId for 15 more minutes
			mw.storage.set( KEYS.EXPIRES, now + bucketParams.sessionLength );

		}
		return sessionId;
	}

	testOnly = location.hash.slice( 1 ) === bucketParams.testGroups.test;

	sessionId = getSessionId();

	if ( sessionId ) {
		Math.seedrandom( sessionId );
		group = testOnly ? bucketParams.testGroups.test : getTestGroup();
	} else {
		group = 'rejected';
		testOnly = true; // prevent logging if sessionId can't be generated
	}

	if ( bucketParams.testGroups && group === bucketParams.testGroups.test ) {
		document.body.className += ' ' + group;
	}

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
		 * All test groups, can be used to check against `group` to
		 * initiate test code. i.e: if ( group === testGroups.test )
		 */
		testGroups: bucketParams.testGroups,

		/**
		 * the one in x population.
		 * @type {int}
		 */
		populationSize: bucketParams.popSize,

		/**
		 * getTestGroup function exposed publicly for testing purposes.
		 */
		getTestGroup: getTestGroup

	};

}( eventLoggingLite, mw ) );
