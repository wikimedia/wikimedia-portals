/**
 * WMTypeAhead.
 * Displays search suggestions with thumbnail and description
 * as user types into an input field.
 *
 * @constructor
 * @param {string} appendTo  - ID of a container element that the suggestions will be appended to.
 * @param {string} searchInput - ID of a search input whose value will be used to generate search suggestions.
 *
 * @return {Object} Returns an object with the following properties:
 * @return {Element} WMTypeAhead.typeAheadEl - The type-ahead DOM object
 * @return {Function} WMTypeAhead.query - a function that loads the type-ahead suggestions.
 *
 * @example
 * var typeAhead = new WMTypeAhead('containerID', 'inputID');
 * typeAhead.query('search string', 'en');
 *
*/

/* global addEvent, mw, getDevicePixelRatio */
/* exported WMTypeAhead */

var WMTypeAhead = function ( appendTo, searchInput ) {

	var typeAheadID = 'typeahead-suggestions',
		typeAheadEl = document.getElementById( typeAheadID ), // type-ahead DOM element.
		appendEl = document.getElementById( appendTo ),
		searchEl = document.getElementById( searchInput ),
		keyboardIndex = -1,
		thumbnailSize = getDevicePixelRatio() * 80,
		searchLang,
		searchString,
		typeAheadItems,
		activeItem;

	// only create typeAheadEl once on page.
	if ( !typeAheadEl ) {
		typeAheadEl = document.createElement( 'div' );
		typeAheadEl.id = typeAheadID;
		appendEl.appendChild( typeAheadEl );
	}

	/**
	 * serializes a JS object into a URL parameter string.
	 *
	 * @param {Object} obj - object whose properties will be serialized
	 * @returns {string}
	 */
	function serialize( obj ) {
		var serialized = [];
		for ( var prop in obj ) {
			if ( obj.hasOwnProperty( prop ) ) {
				serialized.push( prop + '=' + encodeURIComponent( obj[ prop ] ) );
			}
		}
		return serialized.join( '&' );
	}

	/**
	 * Removes the type-ahead suggestions from the DOM.
	 * Reason for timeout: The typeahead is set to clear on input blur.
	 * When a user clicks on a search suggestion, they triggers the input blur
	 * and remove the typeahead before a click event is registered.
	 * The timeout makes it so a click on the search suggestion is registered before
	 * an input blur.
	 * 300ms is used to account for the click delay on mobile devices.
	 *
	 */
	function clearTypeAhead() {
		setTimeout( function () {
			typeAheadEl.innerHTML = '';
			var searchScript = document.getElementById( 'api_opensearch' );
			if ( searchScript ) { searchScript.src = false; }
		}, 300 );
	}

	/**
	 * Inserts script element containing the Search API results into document head.
	 * The script itself calls the 'portalOpensearchCallback' callback function,
	 *
	 * @param {string} string - query string to search.
	 * @param {string} lang - ISO code of language to search in.
	 */
	function loadQueryScript( string, lang ) {
		// variables declared in parent function.
		searchLang = encodeURIComponent( lang ) || 'en';
		searchString = encodeURIComponent( string );
		if ( searchString.length === 0 ) {
			clearTypeAhead();
			return;
		}

		var script = document.getElementById( 'api_opensearch' ),
			docHead = document.getElementsByTagName( 'head' )[ 0 ],
			hostname = '//' + searchLang + '.wikipedia.org/w/api.php?';

		// If script already exists, remove it.
		if ( script ) {
			docHead.removeChild( script );
		}

		script = document.createElement( 'script' );
		script.id = 'api_opensearch';

		var searchQuery = {
			action: 'query',
			format: 'json',
			generator: 'prefixsearch',
			prop: 'pageprops|pageimages|pageterms',
			redirects: '',
			ppprop: 'displaytitle',
			piprop: 'thumbnail',
			pithumbsize: thumbnailSize,
			pilimit: 6,
			wbptterms: 'description',
			gpssearch: string,
			gpsnamespace: 0,
			gpslimit: 6,
			callback: 'portalOpensearchCallback'
		};

		script.src = hostname + serialize( searchQuery );
		docHead.appendChild( script );
	}
	// END loadQueryScript

	/**
	 * Highlights the part of the suggestion title that matches the search query.
	 * Used inside the generateTemplateString function.
	 *
	 * @param {string} title - the title of the search suggestion.
	 * @param {string} searchString - the string to highlight
	 * @returns {string} the title with highlighted part in an <em> tag.
	 */
	function highlightTitle( title, searchString ) {

		var sanitizedSearchString = mw.html.escape( mw.RegExp.escape( searchString ) ),
			searchRegex = new RegExp( sanitizedSearchString, 'i' ),
			startHighlightIndex = title.search( searchRegex ),
			formattedTitle = mw.html.escape( title );

		if ( startHighlightIndex >= 0 ) {

			var endHighlightIndex = startHighlightIndex + sanitizedSearchString.length,
				strong = title.substring( startHighlightIndex, endHighlightIndex ),
				beforeHighlight = title.substring( 0, startHighlightIndex ),
				aferHighlight = title.substring( endHighlightIndex, title.length );

			formattedTitle = beforeHighlight + mw.html.element( 'em', { 'class': 'suggestion-highlight' }, strong ) + aferHighlight;
		}

		return formattedTitle;
	} // END highlightTitle

	/**
	 * Generates a template string based on an array of search suggestions.
	 *
	 * @param {Array} suggestions - an array of search suggestion results.
	 * @returns {string} A string representing the search suggestions DOM
	 */
	function generateTemplateString( suggestions ) {
		var string = '<ul class="suggestions-dropdown">';

		for ( var i = 0; i < suggestions.length; i++ ) {

			if ( !suggestions[ i ] ) {
				continue;
			}
			/**
			 * Indentation is used to express the DOM order of template.
			 */
			var suggestionItem,
					suggestionLink,
						suggestionThumbnail,
						suggestionText,
							suggestionTitle,
							suggestionDescription,
				page = suggestions[ i ],
				sanitizedThumbURL = false;

			if ( page.thumbnail && page.thumbnail.source ) {
				sanitizedThumbURL = page.thumbnail.source.replace( /\"/g, '%22' );
				sanitizedThumbURL = sanitizedThumbURL.replace( /'/g, '%27' );
			}

			suggestionDescription = mw.html.element( 'p', { 'class': 'suggestion-description' }, ( page.terms && page.terms.description ) ? page.terms.description.toString() : ''  );

			suggestionTitle = mw.html.element( 'h3', { 'class': 'suggestion-title' }, new mw.html.Raw( highlightTitle( page.title, searchString ) ) ) ;

			suggestionText = mw.html.element( 'div', { 'class': 'suggestion-text' }, new mw.html.Raw( suggestionTitle + suggestionDescription ) );

			suggestionThumbnail = mw.html.element( 'div', {
				'class': 'suggestion-thumbnail',
				style: ( sanitizedThumbURL ) ? 'background-image:url(' + sanitizedThumbURL + ')' : false
			}, '' );

			suggestionLink = mw.html.element( 'a', {
				'class': 'suggestion-link',
				href: 'https://' + searchLang + '.wikipedia.org/wiki/' + encodeURIComponent( page.title.replace( / /gi, '_' ) )
			}, new mw.html.Raw( suggestionText + suggestionThumbnail ) );

			suggestionItem = mw.html.element( 'li', { 'class': 'suggestion-item' }, new mw.html.Raw( suggestionLink )  );

			string += suggestionItem;

		}

		string += '</ul>';

		return string;
	} // END generateTemplateString

	/**
	 * Search API callback.
	 *  - parses the search results
	 *  - generates the template String
	 *  - inserts the template string into the DOM
	 *  - attaches event listeners on each suggestion item.
	 *
	 * @param {Object} xhrResults
	 */
	window.portalOpensearchCallback = function ( xhrResults ) {

		if ( document.activeElement !== searchEl ) { return; }

		var orderedResults = [],
			suggestions = ( xhrResults.query && xhrResults.query.pages ) ? xhrResults.query.pages : [] ;

		for ( var item in suggestions ) {
			var result = suggestions[ item ];
			orderedResults[ result.index - 1 ] = result;
		}

		var templateDOMString = generateTemplateString( orderedResults );

		typeAheadEl.innerHTML = templateDOMString;

		typeAheadItems = typeAheadEl.childNodes[ 0 ].childNodes;

		// attaching hover events
		for ( var i = 0; i < typeAheadItems.length; i++ ) {
			var listEl = typeAheadItems[ i ];
			// Requires the addEvent global polyfill
			addEvent( listEl, 'mouseenter', toggleActiveClass.bind( this, listEl, typeAheadItems ) );
			addEvent( listEl, 'mouseleave', toggleActiveClass.bind( this, listEl, typeAheadItems ) );
		}
	};

	/* Mouse and keyboard Events */

	/**
	 * - Removes 'active' class from a collection of elements.
	 * - Adds 'active' class to an item if missing.
	 * - Removes 'active' class from item if present.
	 *
	 * @param {Element} item - item to add active class to.
	 * @param {NodeList} collection - sibling items
	 */

	function toggleActiveClass( item, collection ) {

		var activeClass = ' active'; // prefixed with space.

		for ( var i = 0; i < collection.length; i++ ) {

			var colItem = collection[ i ];
			// remove the class name from everything except item.
			if ( colItem !== item ) {
				colItem.className = colItem.className.replace( activeClass, '' );
			} else {
				// if item has class name, remove it
				if ( / active/.test( item.className ) ) {
					item.className = item.className.replace( activeClass, '' );
				} else {
					// it item doesn't have class name, add it.
					item.className += activeClass;
				}
			}
		}
	}

	/**
	 * Increments a global 'keyboardIndex' variable
	 *
	 * @param {int} i - current index
	 * @param {int} max -
	 */
	function incrementKeyboardIndex( i, max ) {

		keyboardIndex = keyboardIndex + i;

		if ( keyboardIndex < 0 ) { keyboardIndex = max - 1; }
		if ( keyboardIndex > max - 1 ) { keyboardIndex = 0; }
	}

	/**
	 * Keyboard events: up arrow, down arrow and enter.
	 * moves the 'active' suggestion up and down.
	 *
	 * @param {event} event
	 */
	function keyboardEvents( event ) {

		var e = event || window.event,
			keycode =  e.which || e.keyCode;

		if ( !typeAheadEl.firstChild ) {
			return;
		}

		if ( keycode === 40 || keycode === 38 ) {
			var suggestionItems = typeAheadEl.firstChild.childNodes,
				suggestionsLength = suggestionItems.length;

			if ( keycode === 40 ) {
				incrementKeyboardIndex( 1, suggestionsLength );
			} else {
				incrementKeyboardIndex( -1, suggestionsLength );
			}

			activeItem = ( typeAheadEl.firstChild ) ? typeAheadEl.firstChild.childNodes[ keyboardIndex ] : false ;

			toggleActiveClass( activeItem, suggestionItems );

		}
		if ( keycode === 13 && activeItem ) {

			if ( e.preventDefault ) {
				e.preventDefault();
			} else {
				( e.returnValue = false );
			}

			activeItem.children[ 0 ].click();
		}
	}

	addEvent( searchEl, 'keydown', keyboardEvents );

	addEvent( searchEl, 'blur', clearTypeAhead );

	return {
		typeAheadEl: typeAheadEl,
		query: loadQueryScript
	};
};
