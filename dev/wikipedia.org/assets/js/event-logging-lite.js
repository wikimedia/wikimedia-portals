/*global
    JSON, console
*/

/**
*
* A slimmed down version of the event logging API.
* Mostly copy & pasted from:
* https://github.com/wikimedia/mediawiki-extensions-EventLogging/blob/master/modules/ext.eventLogging.core.js
* without dependencies on jQuery or mediawiki.js. For use on wikipedia.org portal page.
*
*/

( function () {

	'use strict';

	var baseUrl = '/beacon/event',
	byteToHex = [],
	self, helpers;

	helpers = {
		// replaces $.extend
		extend: function ( defaults, options ) {
			var extended = {},
			prop;

			for ( prop in defaults ) {
				if ( Object.prototype.hasOwnProperty.call( defaults, prop ) && defaults[ prop ] ) {
					extended[ prop ] = defaults[ prop ];
				}
			}
			for ( prop in options ) {
				if ( Object.prototype.hasOwnProperty.call( options, prop ) && options[ prop ] ) {
					extended[ prop ] = options[ prop ];
				}
			}
			return extended;
		},
		// replaces $.noop
		noop: function () {}
	};

	// byte to hex from
	// https://github.com/wikimedia/mediawiki/blob/e87668e86ce9ad20df05c1baa8e7cf3f58900524/resources/src/mediawiki/mediawiki.user.js
	for ( var i = 0; i < 256; i++ ) {
		// Padding: Add a full byte (0x100, 256) and strip the extra character
		byteToHex[ i ] = ( i + 256 ).toString( 16 ).slice( 1 );
	}

	self = window.eventLoggingLite = {

		schema: {},

		maxUrlSize: 2000,

		byteToHex: byteToHex,

		/**
		 * Checks whether a beacon url is short enough,
		 * so that it does not get truncated by varnishncsa.
		 *
		 * @param {string} schemaName Canonical schema name.
		 * @param {string} url Beacon url.
		 * @return {string|undefined} The error message in case of error.
		 */
		checkUrlSize: function ( schemaName, url ) {
			var message;
			if ( url.length > self.maxUrlSize ) {
				message = 'Url exceeds maximum length';
				return message;
			}
		},

		/**
		 * Generate a random user session ID.
		 *
		 * This information would potentially be stored in a cookie to identify a user during a
		 * session or series of sessions. Its uniqueness should not be depended on unless the
		 * browser supports the crypto API.
		 *
		 * Known problems with Math.random():
		 * Using the Math.random function we have seen sets
		 * with 1% of non uniques among 200,000 values with Safari providing most of these.
		 * Given the prevalence of Safari in mobile the percentage of duplicates in
		 * mobile usages of this code is probably higher.
		 *
		 * Rationale:
		 * We need about 64 bits to make sure that probability of collision
		 * on 500 million (5*10^8) is <= 1%
		 * See https://en.wikipedia.org/wiki/Birthday_problem#Probability_table
		 *
		 * @return {string} 64 bit integer in hex format, padded
		 */
		generateRandomSessionId: function () {

			/*jshint bitwise:false */
			var rnds, i, r,
			hexRnds = new Array( 8 ),
			// Support: IE 11
			crypto = window.crypto || window.msCrypto;

			// Based on https://github.com/broofa/node-uuid/blob/bfd9f96127/uuid.js
			if ( crypto && crypto.getRandomValues ) {
				// Fill an array with 8 random values, each of which is 8 bits.
				// Note that Uint8Array is array-like but does not implement Array.
				rnds = new Uint8Array( 8 );
				crypto.getRandomValues( rnds );
			} else {
				rnds = new Array( 8 );
				for ( i = 0; i < 8; i++ ) {
					if ( ( i & 3 ) === 0 ) {
						r = Math.random() * 0x100000000;
					}
					rnds[ i ] = r >>> ( ( i & 3 ) << 3 ) & 255;
				}
			}
			// Convert from number to hex
			for ( i = 0; i < 8; i++ ) {
				hexRnds[ i ] = self.byteToHex[ rnds[ i ] ];
			}

			// Concatenation of two random integers with entrophy n and m
			// returns a string with entrophy n+m if those strings are independent
			return hexRnds.join( '' );

		},

		/**
		 * Check whether a JavaScript object conforms to a JSON Schema.
		 *
		 * @param {Object} obj Object to validate.
		 * @param {Object} schema JSON Schema object.
		 * @return {Array} An array of validation errors (empty if valid).
		 */
		validate: function ( obj, schema ) {
			var key, val, prop,
			errors = [];

			if ( !schema || !schema.properties ) {
				errors.push( 'Missing or empty schema' );
				return errors;
			}

			for ( key in obj ) {
				if ( !schema.properties.hasOwnProperty( key ) ) {
					errors.push( 'Undeclared property: ' + key );
				}
			}

			for ( key in schema.properties ) {
				prop = schema.properties[ key ];

				if ( !obj.hasOwnProperty( key ) ) {
					if ( prop.required ) {
						errors.push( 'Missing property:', key );
					}
					continue;
				}
				val = obj[ key ];

				if ( prop[ 'enum' ] && prop.required && prop[ 'enum' ].indexOf( val ) === -1 ) {
					errors.push( 'Value "' + JSON.stringify( val ) + '" for property "' + key + '" is not one of ' + JSON.stringify( prop[ 'enum' ] ) );
				}
			}

			return errors;

		},

		/**
		 * Prepares an event for dispatch by filling defaults for any missing
		 * properties and by encapsulating the event object in an object which
		 * contains metadata about the event itself.
		 *
		 * @param {string} schema Canonical schema name.
		 * @param {Object} eventData Event instance.
		 * @return {Object} Encapsulated event.
		 */
		prepare: function ( schema, eventData ) {

			var event = helpers.extend( schema.defaults, eventData ),
			errors = self.validate( event, schema );

			while ( errors.length ) {
				console.log( errors[ errors.length - 1 ] );
				errors.pop();
			}

			return {
				event: event,
				revision: schema.revision || -1,
				schema: schema.name,
				webHost: location.hostname,
				wiki: 'metawiki'
			};
		},

		/**
		 * Constructs the EventLogging URI based on the base URI and the
		 * encoded and stringified data.
		 *
		 * @param {Object} data Payload to send
		 * @return {string|boolean} The URI to log the event.
		 */
		makeBeaconUrl: function ( data ) {
			var queryString = encodeURIComponent( JSON.stringify( data ) );
			return baseUrl + '?' + queryString + ';';
		},

		/**
		 * Transfer data to a remote server by making a lightweight HTTP
		 * request to the specified URL.
		 *
		 * If the user expressed a preference not to be tracked, or if
		 * $wgEventLoggingBaseUri is unset, this method is a no-op.
		 *
		 * @param {string} url URL to request from the server.
		 * @return undefined
		 */
		sendBeacon: ( /1|yes/.test( navigator.doNotTrack ) || !baseUrl )
		? helpers.noop
		: navigator.sendBeacon
		? function ( url ) { try { navigator.sendBeacon( url ); } catch ( e ) {} }
		: function ( url ) { document.createElement( 'img' ).src = url; },

		/**
		 * Construct and transmit to a remote server a record of some event
		 * having occurred. Events are represented as JavaScript objects that
		 * conform to a JSON Schema. The schema describes the properties the
		 * event object may (or must) contain and their type. This method
		 * represents the public client-side API of EventLogging.
		 *
		 * @param {string} schemaName Canonical schema name.
		 * @param {Object} eventData Event object.
		 */
		logEvent: function ( schemaName, eventData ) {
			var event = self.prepare( schemaName, eventData ),
			url = self.makeBeaconUrl( event ),
			sizeError = self.checkUrlSize( schemaName, url );

			if ( !sizeError ) {
				self.sendBeacon( url );
			}
		}

	}; // eventLoggingLite

}() );
