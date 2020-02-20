/* eslint-env node */
var Handlebars = require( 'handlebars' ),
	helpers = {};

/**
 * If `attrs` is an object in the current context,
 * it will print out the properties and their values
 * as if they were element attributes.
 *
 *     // if this is:
 *     { 'id': 'elt_id', 'class': 'elt_class' }
 *
 *     // it will output:
 *     ' id="elt_id" class="elt_class"'
 *
 * For security reasons, we only support whitelisted attributes.
 * A warning message will be prompted (for review) when an attribute is
 * rejected.
 *
 * @param {string} attrs
 * @return {Handlebars.SafeString}
 */
helpers.printAttrs = function ( attrs ) {
	var output = '',
		whiteList = [ 'id', 'class', 'lang', 'data-converttitle-hans', 'data-convert-hans' ],
		lowercase, attr;

	if ( this[ attrs ] ) {
		for ( attr in this[ attrs ] ) {
			lowercase = attr.toLowerCase();
			if ( whiteList.indexOf( lowercase ) > -1 ) {
				output += ' ' + Handlebars.escapeExpression( lowercase ) + '="' + Handlebars.escapeExpression( this[ attrs ][ attr ] ) + '"';
			} else {
				console.log( '\x1b[31m' );
				console.log( 'Warning: the attr "' + lowercase + '" was rejected by the printAttrs helper.' );
				console.log( '\x1b[0m' );
			}
		}
	}
	return new Handlebars.SafeString( output );
};

/**
 * Equal to helper
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @param {Object} options Handlebars options object.
 * @return {Function}
 */
helpers.eq = function ( a, b, options ) {
	return ( a === b ) ? options.fn( this ) : options.inverse( this );
};

/**
 * Converts the number into a string and adds a space to separate each group of
 * 3 digits.
 *
 * Inspired from http://stackoverflow.com/a/2254896
 *
 * @param {number} number
 * @return {string}
 * @private
 */
function thousandFloor( number ) {
	return number.toString().replace( /(\d)(?=(\d{3})+(?!\d))/g, '$1 ' );
}

/**
 *
 * @param {number} number
 * @param {Object} options Handlebars options object.
 * @param {Object} options.hash
 * @param {boolean} [options.hash.thousandSeparator=false] Numbers are run through
 *  {@link #thousandFloor}.
 * @param {boolean} [options.hash.rounded=false] Rounds numbers downwards to
 *  the nearest power of ten, up to a thousand.
 * @param {boolean} [options.hash.nbsp=false] The separating space is replaced by
 *  a `&nbsp;`.
 * @return {Handlebars.SafeString}
 */
helpers.formatNumber = function ( number, options ) {
	var numberLength, powerOfTen;

	if ( options.hash.rounded ) {
		numberLength = Math.min( number.toString().length - 1, 3 );
		powerOfTen = Math.pow( 10, numberLength );

		number = Math.floor( number / powerOfTen ) * powerOfTen;
	}
	if ( options.hash.thousandSeparator ) {
		number = thousandFloor( number );
	}
	if ( options.hash.nbsp ) {
		number = number.toString().split( ' ' ).join( '&nbsp;' );
	}
	return new Handlebars.SafeString( number );
};

/**
 * Wraps a block to allow you to put `~` on this helper
 * in order to clean whitespaces.
 *
 * @param {Object} options Handlebars options object.
 * @return {Function}
 */
helpers.trim = function ( options ) {
	return options.fn( this );
};

/**
 * Checks if an array contains an element.
 *
 * @param {Mixed} list
 * @param {Array} elem
 * @param {Object} options Handlebars options object.
 * @return {Function}
 */
helpers.has = function ( list, elem, options ) {
	if ( list.indexOf( elem ) > -1 ) {
		return options.fn( this );
	}
	return options.inverse( this );
};

module.exports = helpers;
