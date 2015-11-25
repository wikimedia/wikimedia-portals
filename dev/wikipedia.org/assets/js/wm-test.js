// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/*global
 eventLoggingLite
 */

window.wmTest = ( function ( eventLoggingLite ) {

	'use strict';

	var sessionId = eventLoggingLite.generateRandomSessionId(),
		populationSize = 2, // population size for beta or dev
		group,
		sessionExpiration = 15 * 60 * 1000, // 15 minutes
		KEYS = {
			GROUP: 'portal_test_group',
			SESSION_ID: 'portal_session_id',
			EXPIRES: 'portal_test_group_expires'
		},
		testOnly = location.hash.slice( 1 ) === 'pab1';

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

		// 1:populationSize of the people are tested
		if ( oneIn( sessionId, populationSize ) ) {

			var notIe8 = !document.attachEvent;
			// 1:2 of the people who are tested get the AB test 1
			if ( notIe8 && oneIn( eventLoggingLite.generateRandomSessionId(), 2 ) ) {
				return 'abtest1';
			} else {
				// baseline
				return null;
			}
		} else {
			return 'rejected';
		}
	}

	if ( testOnly ) {
		group = 'abtest1';
	} else if ( window.localStorage ) {
		var portalGroup = localStorage.getItem( KEYS.GROUP ),
			portalSessionId = localStorage.getItem( KEYS.SESSION_ID ),
			expires = localStorage.getItem( KEYS.EXPIRES ),
			now = new Date().getTime();

		if ( expires &&
			portalSessionId &&
			portalGroup &&
			now < parseInt( expires, 10 )
		) {
			sessionId = portalSessionId;
			group = portalGroup;
		} else {
			group = getTestGroup( sessionId );
			localStorage.setItem( KEYS.SESSION_ID, sessionId );
			localStorage.setItem( KEYS.GROUP, group );
		}
		// set or extend for 15 more minutes
		localStorage.setItem( KEYS.EXPIRES, now + sessionExpiration );
	} else {
		group = 'rejected';
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
		 * User population group
		 *
		 * @type {string}
		 */
		group: group,

		/**
		 * Whether user is part of AB test 1
		 *
		 * @type {boolean}
		 */
		abtest1: ( group === 'abtest1' )
	};

}( eventLoggingLite ) );
