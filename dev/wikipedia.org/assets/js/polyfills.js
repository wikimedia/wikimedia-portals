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
 * https://gist.github.com/chrisjlee/8960575
 */
if (!document.querySelectorAll) {
	document.querySelectorAll = function (selectors) {
		var style = document.createElement('style'), elements = [], element;
		document.documentElement.firstChild.appendChild(style);
		document._qsa = [];

		style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
		window.scrollBy(0, 0);
		style.parentNode.removeChild(style);

		while (document._qsa.length) {
			element = document._qsa.shift();
			element.style.removeAttribute('x-qsa');
			elements.push(element);
		}
		document._qsa = null;
		return elements;
	};
}

if (!document.querySelector) {
	document.querySelector = function (selectors) {
		var elements = document.querySelectorAll(selectors);
		return (elements.length) ? elements[0] : null;
	};
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

/**
 * addEventListener polyfill  1.0
 * https://gist.github.com/eirikbacker/2864711/946225eb3822c203e8d6218095d888aac5e1748e
 * Eirik Backer / MIT Licence
 */
(function(win, doc){
	if(win.addEventListener)return;		//No need to polyfill

	function docHijack(p){var old = doc[p];doc[p] = function(v){return addListen(old(v))}}
	function addEvent(on, fn, self){
		return (self = this).attachEvent('on' + on, function(e){
			var e = e || win.event;
			e.preventDefault  = e.preventDefault  || function(){e.returnValue = false}
			e.stopPropagation = e.stopPropagation || function(){e.cancelBubble = true}
			fn.call(self, e);
		});
	}
	function addListen(obj, i){
		if(i = obj.length)while(i--)obj[i].addEventListener = addEvent;
		else obj.addEventListener = addEvent;
		return obj;
	}

	addListen([doc, win]);
	if('Element' in win)win.Element.prototype.addEventListener = addEvent;
	else{
		doc.attachEvent('onreadystatechange', function(){addListen(doc.all)});
		docHijack('getElementsByTagName');
		docHijack('getElementById');
		docHijack('createElement');
		addListen(doc.all);
	}
})(window, document);
