// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/*global mw, eventLoggingLite, getIso639, addEvent */

window.wmTest = ( function ( eventLoggingLite, mw ) {

	'use strict';
	var sessionId = eventLoggingLite.generateRandomSessionId(),
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

		// survey banner test.
		testOnly = ( location.hash.slice( 1 ) === 'survey-banner' );

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
	 * If we're on production, increase population size.
	 */
	if ( /www.wikipedia.org/.test( location.hostname ) ) {
		populationSize = 200;
	}

	/**
	 * Puts the user in a population group randomly.
	 */
	function getTestGroup( sessionId ) {

		var group = 'rejected';
		// 1:populationSize of the people are tested (baseline)
		if ( oneIn( sessionId, populationSize ) ) {
			group = 'baseline';
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
	 * Qaultrics Survey Banner
	 * -----------------------
	 * Display survey banner to 1 in 30 users in the 'rejected' group.
	 * We only target rejected users because our schema doesn't have a
	 * 'survey-banner' clickthrough group, and thus clickthough events
	 * for these users would not be logged.
	 * https://phabricator.wikimedia.org/T134512
	 */
	function surveyBanner() {

		// only display banner to 1 in 30 users in the 'rejected' group
		if ( ( oneIn( sessionId, 30 ) && group === 'rejected' ) || testOnly ) {

			// see if existing cookie to hide banner exists.
			if ( document.cookie.match( /hideBanner/ )  && testOnly === false ) {
				return;
			}

			var banner = document.getElementById( 'js-survey-banner' ),
				closeBannerButton = document.getElementById( 'js-survey-hide-banner' );

			banner.style.display = 'block';

			var closeBanner = function () {
				banner.style.display = 'none';

				// set cookie to hide banner for 24 hours.
				var now = new Date();
				now.setTime( now.getTime() + 24 * 3600 * 1000 );
				document.cookie = 'hideBanner=true; expires=' + now.toUTCString();
			};

			addEvent( closeBannerButton, 'click', closeBanner );

			// disable event logging for those with banner.
			// see ticket T134512 for rationale.
			testOnly = true;
		}

	}
	surveyBanner();

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
