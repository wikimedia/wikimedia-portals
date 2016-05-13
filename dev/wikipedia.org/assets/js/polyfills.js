// jshint ignore: start
// jscs:disable

/**
 * Polyfills for IE8 and under
 * code taken from https://developer.mozilla.org/ is dedicated to the Public Domain:
 * https://developer.mozilla.org/en-US/docs/MDN/About#Copyrights_and_licenses
 */

/**
 * basic JSON polyfill
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON
 */
if (!window.JSON) {
	window.JSON = {
		parse: function( sJSON ) { return eval( '(' + sJSON + ')' ); },
		stringify: ( function () {
			var toString = Object.prototype.toString;
			var isArray = Array.isArray || function ( a ) { return toString.call (a ) === '[object Array]'; };
			var escMap = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'};
			var escFunc = function ( m ) { return escMap[ m ] || '\\u' + ( m.charCodeAt( 0 ) + 0x10000 ).toString( 16 ).substr( 1 ); };
			var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
			return function stringify( value ) {
				if ( value == null ) {
					return 'null';
				} else if ( typeof value === 'number' ) {
					return isFinite( value ) ? value.toString() : 'null';
				} else if ( typeof value === 'boolean' ) {
					return value.toString();
				} else if ( typeof value === 'object' ) {
					if ( typeof value.toJSON === 'function' ) {
						return stringify( value.toJSON() );
					} else if ( isArray( value ) ) {
						var res = '[';
						for ( var i = 0; i < value.length; i++ )
							res += ( i ? ', ' : '') + stringify( value[ i ] );
						return res + ']';
					} else if ( toString.call( value ) === '[object Object]' ) {
						var tmp = [];
						for ( var k in value ) {
							if ( value.hasOwnProperty( k ) )
								tmp.push( stringify( k ) + ': ' + stringify( value[ k ] ) );
						}
						return '{' + tmp.join( ', ' ) + '}';
					}
				}
				return '"' + value.toString().replace( escRE, escFunc ) + '"';
			};
		})()
	};
}

/**
 * Array.indexOf polyfill
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf#Compatibility
 */

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(searchElement, fromIndex) {

		var k;

		if (this == null) {
			throw new TypeError('"this" is null or not defined');
		}

		var O = Object(this);

		var len = O.length >>> 0;

		if (len === 0) {
			return -1;
		}

		var n = +fromIndex || 0;

		if (Math.abs(n) === Infinity) {
			n = 0;
		}

		if (n >= len) {
			return -1;
		}

		k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

		while (k < len) {
			if (k in O && O[k] === searchElement) {
				return k;
			}
			k++;
		}
		return -1;
	};
}

/**
 * Document.querySelectorAll polyfill
 *
 * Implements polyfill for querySelectorAll to use in old IE browsers.
 *
 * Supports multiple / grouped selectors and the attribute selector with a "for"
 * attribute.
 *
 * @see http://www.codecouch.com/2012/05/adding-document-queryselectorall-support-to-ie-7/
*/
(function () {
	if (!window.document.querySelectorAll) {
		document.querySelectorAll = document.body.querySelectorAll = Object.querySelectorAll = function querySelectorAllPolyfill(r, c, i, j, a) {
			var d=document,
				s=d.createStyleSheet();
			a = d.all;
			c = [];
			r = r.replace(/\[for\b/gi, '[htmlFor').split(',');
			for (i = r.length; i--;) {
				s.addRule(r[i], 'k:v');
				for (j = a.length; j--;) {
					a[j].currentStyle.k && c.push(a[j]);
				}
				s.removeRule(0);
			}
			return c;
		};
	}
})();

if (!document.querySelector) {
	document.querySelector = function (selectors) {
		var elements = document.querySelectorAll(selectors);
		return (elements.length) ? elements[0] : null;
	};
}

/**
 * Object.bind polyfill
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
 */
if (!Function.prototype.bind) {
	Function.prototype.bind = function(oThis) {
		if (typeof this !== 'function') {
			// closest thing possible to the ECMAScript 5
			// internal IsCallable function
			throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
		}

		var aArgs   = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			fNOP    = function() {},
			fBound  = function() {
				return fToBind.apply(this instanceof fNOP
						? this
						: oThis,
					aArgs.concat(Array.prototype.slice.call(arguments)));
			};

		if (this.prototype) {
			// native functions don't have a prototype
			fNOP.prototype = this.prototype;
		}
		fBound.prototype = new fNOP();

		return fBound;
	};
}

/**
 * Element.textContent polyfill
 * https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
 */

if (Object.defineProperty
	&& Object.getOwnPropertyDescriptor
	&& Object.getOwnPropertyDescriptor(Element.prototype, "textContent")
	&& !Object.getOwnPropertyDescriptor(Element.prototype, "textContent").get) {
	(function() {
		var innerText = Object.getOwnPropertyDescriptor(Element.prototype, "innerText");
		Object.defineProperty(Element.prototype, "textContent",
			{
				get: function() {
					return innerText.get.call(this);
				},
				set: function(s) {
					return innerText.set.call(this, s);
				}
			}
		);
	})();
}

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
 * Removes all event handlers in Internet Explorer 8 and below.
 *
 * Any attached event handlers are stored in memory until IE exits, leaking
 * every time you leave (or reload) the page. This method cleans up any
 * event handlers that remain at the time the page is unloaded.
 */
window.onunload = function () {
	var i, evt;
	for ( i = 0; i < attachedEvents.length; i++ ) {
		evt = attachedEvents[ i ];
		if ( evt[ 0 ] ) {
			evt[ 0 ].detachEvent( 'on' + evt[ 1 ], evt[ 2 ] );
		}
	}
	attachedEvents = [];
};


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
