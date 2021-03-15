/* eslint-disable */

/**
 * Polyfills for IE8 and under
 * code taken from https://developer.mozilla.org/ is dedicated to the Public Domain:
 * https://developer.mozilla.org/en-US/docs/MDN/About#Copyrights_and_licenses
 */

/**
 * Element.matches polyfill
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
 */
if ( window.Element && !Element.prototype.matches ) {

	Element.prototype.matches = function matches( selector ) {
		var matches = ( this.document || this.ownerDocument ).querySelectorAll( selector ),
			i = matches.length;
		while ( --i >= 0 && matches.item(i) !== this ) ;
		return i > -1;
	};
}

window.attachedEvents = [];

function addEvent( obj, evt, fn ) {

	if ( !obj ) {
		return;
	}

	if ( obj.addEventListener ) {
		obj.addEventListener( evt, fn, false );
	} else if ( obj.attachEvent ) {
		attachedEvents.push( [ obj, evt, fn ] );
		obj.attachEvent( 'on' + evt, fn );
	}
}

function removeEvent( obj, evt, fn ) {

	if ( !obj ) {
		return;
	}

	if ( obj.removeEventListener ) {
		obj.removeEventListener( evt, fn );
	} else if ( obj.detachEvent ) {
		obj.detachEvent( 'on' + evt, fn );
	}
}

/**
 * Queues the given function to be called once the DOM has finished loading.
 *
 * Based on jquery/src/core/ready.js@825ac37 (MIT licensed)
 */
function doWhenReady( fn ) {
	var ready = function () {
		removeEvent( document, 'DOMContentLoaded', ready );
		removeEvent( window, 'load', ready );
		fn();
		fn = function() {};
	};

	if ( document.readyState === 'complete' ) {
		// Already ready, so call the function synchronously.
		fn();
	} else {
		// Wait until the DOM or whole page loads, whichever comes first.
		addEvent( document, 'DOMContentLoaded', ready );
		addEvent( window, 'load', ready );
	}
}

/**
 * Below are misc. global functions, not polyfills.
 */

/**
 * Converts strings to iso639.
 * http://www.iso.org/iso/home/standards/language_codes.htm
 */
function getIso639( lang ) {
	var iso639 = lang && lang.match( /^\w+/ );
	if ( !iso639 ) {
		return;
	}
	iso639 = ( iso639[ 0 ] === 'nb' ) ? 'no' : iso639[ 0 ];

	// iso639 codes should be max 4 letters long.
	if ( iso639.length > 3 ) {
		return;
	}
	return iso639;
}

/**
 * Detects reported or approximate device pixel ratio.
 * * 1.0 means 1 CSS pixel is 1 hardware pixel
 * * 2.0 means 1 CSS pixel is 2 hardware pixels
 * * etc.
 *
 * Uses window.devicePixelRatio if available, or CSS media queries on IE.
 *
 * @returns {number} Device pixel ratio
 */
function getDevicePixelRatio () {

	if ( window.devicePixelRatio !== undefined ) {
		// Most web browsers:
		// * WebKit (Safari, Chrome, Android browser, etc)
		// * Opera
		// * Firefox 18+
		return window.devicePixelRatio;
	} else if ( window.msMatchMedia !== undefined ) {
		// Windows 8 desktops / tablets, probably Windows Phone 8
		//
		// IE 10 doesn't report pixel ratio directly, but we can get the
		// screen DPI and divide by 96. We'll bracket to [1, 1.5, 2.0] for
		// simplicity, but you may get different values depending on zoom
		// factor, size of screen and orientation in Metro IE.
		if ( window.msMatchMedia( '(min-resolution: 192dpi)' ).matches ) {
			return 2;
		} else if ( window.msMatchMedia( '(min-resolution: 144dpi)' ).matches ) {
			return 1.5;
		} else {
			return 1;
		}
	} else {
		// Legacy browsers...
		// Assume 1 if unknown.
		return 1;
	}
}
