var mw = mw || {};

mw.html = ( function () {
	function escapeCallback( s ) {
		switch ( s ) {
			case '\'':
				return '&#039;';
			case '"':
				return '&quot;';
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			case '&':
				return '&amp;';
		}
	}

	return {
		/**
		 * Escape a string for HTML.
		 *
		 * Converts special characters to HTML entities.
		 *
		 *     mw.html.escape( '< > \' & "' );
		 *     // Returns &lt; &gt; &#039; &amp; &quot;
		 *
		 * @param {string} s The string to escape
		 * @return {string} HTML
		 */
		escape: function ( s ) {
			return s.replace( /['"<>&]/g, escapeCallback );
		},

		/**
		 * Create an HTML element string, with safe escaping.
		 *
		 * @param {string} name The tag name.
		 * @param {Object} attrs An object with members mapping element names to values
		 * @param {Mixed} contents The contents of the element. May be either:
		 *
		 *  - string: The string is escaped.
		 *  - null or undefined: The short closing form is used, e.g. `<br/>`.
		 *  - this.Raw: The value attribute is included without escaping.
		 *  - this.Cdata: The value attribute is included, and an exception is
		 *    thrown if it contains an illegal ETAGO delimiter.
		 *    See <http://www.w3.org/TR/1999/REC-html401-19991224/appendix/notes.html#h-B.3.2>.
		 * @return {string} HTML
		 */
		element: function ( name, attrs, contents ) {
			var v, attrName, s = '<' + name;

			for ( attrName in attrs ) {
				v = attrs[ attrName ];
				// Convert name=true, to name=name
				if ( v === true ) {
					v = attrName;
					// Skip name=false
				} else if ( v === false ) {
					continue;
				}
				s += ' ' + attrName + '="' + this.escape( String( v ) ) + '"';
			}
			if ( contents === undefined || contents === null ) {
				// Self close tag
				s += '/>';
				return s;
			}
			// Regular open tag
			s += '>';
			switch ( typeof contents ) {
				case 'string':
					// Escaped
					s += this.escape( contents );
					break;
				case 'number':
				case 'boolean':
					// Convert to string
					s += String( contents );
					break;
				default:
					if ( contents instanceof this.Raw ) {
						// Raw HTML inclusion
						s += contents.value;
					} else if ( contents instanceof this.Cdata ) {
						// CDATA
						if ( /<\/[a-zA-z]/.test( contents.value ) ) {
							throw new Error( 'mw.html.element: Illegal end tag found in CDATA' );
						}
						s += contents.value;
					} else {
						throw new Error( 'mw.html.element: Invalid type of contents' );
					}
			}
			s += '</' + name + '>';
			return s;
		},

		/**
		 * Wrapper object for raw HTML passed to mw.html.element().
		 *
		 * @class mw.html.Raw
		 */
		Raw: function ( value ) {
			this.value = value;
		},

		/**
		 * Wrapper object for CDATA element contents passed to mw.html.element()
		 *
		 * @class mw.html.Cdata
		 */
		Cdata: function ( value ) {
			this.value = value;
		}
	};
}() );

mw.storage = {

	localStorage: window.localStorage,

	/**
	 * Retrieve value from device storage.
	 *
	 * @param {string} key Key of item to retrieve
	 * @return {string|boolean} False when localStorage not available, otherwise string
	 */
	get: function ( key ) {
		try {
			return mw.storage.localStorage.getItem( key );
		} catch ( e ) {}
		return false;
	},

	/**
	 * Set a value in device storage.
	 *
	 * @param {string} key Key name to store under
	 * @param {string} value Value to be stored
	 * @return {boolean} Whether the save succeeded or not
	 */
	set: function ( key, value ) {
		try {
			mw.storage.localStorage.setItem( key, value );
			return true;
		} catch ( e ) {}
		return false;
	},

	/**
	 * Remove a value from device storage.
	 *
	 * @param {string} key Key of item to remove
	 * @return {boolean} Whether the save succeeded or not
	 */
	remove: function ( key ) {
		try {
			mw.storage.localStorage.removeItem( key );
			return true;
		} catch ( e ) {}
		return false;
	}
};

( function ( mw ) {
	/**
	 * @class mw.RegExp
	 */
	mw.RegExp = {
		/**
		 * Escape string for safe inclusion in regular expression
		 *
		 * The following characters are escaped:
		 *
		 *     \ { } ( ) | . ? * + - ^ $ [ ]
		 *
		 * @since 1.26
		 * @static
		 * @param {string} str String to escape
		 * @return {string} Escaped string
		 */
		escape: function ( str ) {
			return str.replace( /([\\{}()|.?*+\-\^$\[\]])/g, '\\$1' );
		}
	};
}( mw ) );
