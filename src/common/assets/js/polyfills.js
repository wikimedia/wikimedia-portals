/* eslint-disable */

/**
 * Queues the given function to be called once the DOM has finished loading.
 *
 * Based on jquery/src/core/ready.js@825ac37 (MIT licensed)
 */
function doWhenReady( fn ) {
	var ready = function () {
		document.removeEventListener( 'DOMContentLoaded', ready );
		window.removeEventListener( 'load', ready );
		fn();
		fn = function() {};
	};

	if ( document.readyState === 'complete' ) {
		// Already ready, so call the function synchronously.
		fn();
	} else {
		// Wait until the DOM or whole page loads, whichever comes first.
		document.addEventListener( 'DOMContentLoaded', ready );
		window.addEventListener( 'load', ready );
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
	} else {
		// Legacy browsers...
		// Assume 1 if unknown.
		return 1;
	}
}

/**
 * For browsers that do not support Element.closest(), but carry support
 *  for element.matches()
 */
if (!Element.prototype.matches) {
	Element.prototype.matches =
		Element.prototype.msMatchesSelector ||
		Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
	Element.prototype.closest = function(s) {
		var el = this;

	do {
		if (Element.prototype.matches.call(el, s)) return el;
		el = el.parentElement || el.parentNode;
	} while (el !== null && el.nodeType === 1);
	return null;
	};
}
