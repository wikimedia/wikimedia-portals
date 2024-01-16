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
		whiteList = [ 'id', 'class', 'lang', 'data-title-hans', 'data-title-hant', 'data-hans', 'data-hant' ],
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
 * If `classes` is an array in the current context,
 * it will print out its value by concatenating all of the elements in
 * it, separated by spaces.
 *
 *     // if this is:
 *     [ 'class1', 'class2' ]
 *
 *     // it will output:
 *     ' class1 class2'
 *
 * @param {string} classes
 * @return {Handlebars.SafeString}
 */
helpers.printClasses = function ( classes ) {
	var output = '';

	if ( this[ classes ] && Array.isArray( this[ classes ] ) ) {
		output = Handlebars.escapeExpression( ' ' + this[ classes ].join( ' ' ) );
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
 *
 * @param {number} number
 * @param {Object} options Handlebars options object.
 * @param {Object} options.hash
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

	number = number.toLocaleString( options.hash.locale );
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
