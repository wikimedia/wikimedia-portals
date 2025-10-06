/**
 * WMTypeAhead.
 * Displays search suggestions with thumbnail and description
 * as user types into an input field.
 *
 * @constructor
 * @param {string} appendTo  - ID of a container element that the suggestions will be appended to.
 * @param {string} searchInput - ID of a search input whose value will be used to generate
 *                               search suggestions.
 *
 * @return {Object} Returns an object with the following properties:
 * @return {HTMLElement} return.typeAheadEl The type-ahead DOM object.
 * @return {Function} return.query A function that loads the type-ahead suggestions.
 *
 * @example
 * var typeAhead = new WMTypeAhead('containerID', 'inputID');
 * typeAhead.query('search string', 'en');
 */

/* global getDevicePixelRatio,portalSearchDomain */

window.WMTypeAhead = function ( appendTo, searchInput ) {

	const typeAheadID = 'typeahead-suggestions',
		appendEl = document.getElementById( appendTo ),
		searchEl = document.getElementById( searchInput ),
		thumbnailSize = Math.round( getDevicePixelRatio() * 60 ),
		maxSearchResults = 6;
	let typeAheadEl = document.getElementById( typeAheadID ), // Type-ahead DOM element.
		searchLang = null,
		searchString = null;

	// Only create typeAheadEl once on page.
	if ( !typeAheadEl ) {
		typeAheadEl = document.createElement( 'div' );
		typeAheadEl.id = typeAheadID;
		appendEl.appendChild( typeAheadEl );
	}

	/**
	 * Serializes a JS object into a URL parameter string.
	 *
	 * @param {Object} obj - object whose properties will be serialized
	 * @return {string}
	 */
	function serialize( obj ) {
		const serialized = [];

		for ( const prop in obj ) {
			if ( obj.hasOwnProperty( prop ) ) { // eslint-disable-line no-prototype-builtins
				serialized.push( prop + '=' + encodeURIComponent( obj[ prop ] ) );
			}
		}
		return serialized.join( '&' );
	}

	/**
	 * Keeps track of the search query callbacks. Consists of an array of
	 * callback functions and an index that keeps track of the order of requests.
	 * Callbacks are deleted by replacing the callback function with a no-op.
	 */
	window.callbackStack = {
		queue: {},
		index: -1,
		incrementIndex: function () {
			this.index += 1;
			return this.index;
		},
		addCallback: function ( func ) {
			const index = this.incrementIndex();
			this.queue[ index ] = func( index );
			return index;
		},
		deleteSelfFromQueue: function ( i ) {
			delete this.queue[ i ];
		},
		deletePrevCallbacks: function ( j ) {
			let callback;

			this.deleteSelfFromQueue( j );

			for ( callback in this.queue ) {
				if ( callback < j ) {
					this.queue[ callback ] = this.deleteSelfFromQueue.bind(
						window.callbackStack, callback
					);
				}
			}
		}
	};

	/**
	 * Maintains the 'active' state on search suggestions.
	 * Makes sure the 'active' element is synchronized between mouse and keyboard usage,
	 * and cleared when new search suggestions appear.
	 */
	const ssActiveIndex = {
		index: -1,
		max: maxSearchResults,
		setMax: function ( x ) {
			this.max = x;
		},
		increment: function ( i ) {
			this.index += i;
			if ( this.index < 0 ) {
				this.setIndex( this.max - 1 );
			} // Index reaches top
			if ( this.index === this.max ) {
				this.setIndex( 0 );
			} // Index reaches bottom
			return this.index;
		},
		setIndex: function ( i ) {
			if ( i <= this.max - 1 ) {
				this.index = i;
			}
			return this.index;
		},
		clear: function () {
			this.setIndex( -1 );
		}
	};

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
		setTimeout( () => {
			const searchScript = document.getElementById( 'api_opensearch' );
			typeAheadEl.innerHTML = '';
			if ( searchScript ) {
				searchScript.src = false;
			}
			ssActiveIndex.clear();
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
		const docHead = document.getElementsByTagName( 'head' )[ 0 ];

		// Variables declared in parent function.
		searchLang = encodeURIComponent( lang ) || 'en';
		searchString = encodeURIComponent( string );
		if ( searchString.length === 0 ) {
			clearTypeAhead();
			return;
		}

		const hostname = '//' + searchLang + '.' + portalSearchDomain + '/w/api.php?';

		const oldScript = document.getElementById( 'api_opensearch' );
		// If script already exists, remove it.
		if ( oldScript ) {
			docHead.removeChild( oldScript );
		}

		const script = document.createElement( 'script' );
		script.id = 'api_opensearch';

		const callbackIndex = window.callbackStack.addCallback( window.portalOpensearchCallback );
		const searchQuery = {
			action: 'query',
			format: 'json',
			generator: 'prefixsearch',
			prop: 'pageprops|pageimages|description',
			redirects: '',
			ppprop: 'displaytitle',
			piprop: 'thumbnail',
			pithumbsize: thumbnailSize,
			pilimit: maxSearchResults,
			gpssearch: string,
			gpsnamespace: 0,
			gpslimit: maxSearchResults,
			callback: 'callbackStack.queue[' + callbackIndex + ']'
		};

		script.src = hostname + serialize( searchQuery );
		docHead.appendChild( script );
	}

	// END loadQueryScript

	/**
	 * Highlights the part of the suggestion title that matches the search query.
	 * Used inside the generateTemplateString function.
	 *
	 * @param {string} title - The title of the search suggestion.
	 * @param {string} search - The string to highlight.
	 * @return {string} The title with highlighted part in an <em> tag.
	 */
	function highlightTitle( title, search ) {

		const sanitizedSearchString = mw.html.escape( mw.RegExp.escape( search ) ),
			searchRegex = new RegExp( sanitizedSearchString, 'i' ),
			startHighlightIndex = title.search( searchRegex );

		let formattedTitle = mw.html.escape( title );
		if ( startHighlightIndex >= 0 ) {
			const endHighlightIndex = startHighlightIndex + sanitizedSearchString.length;
			const strong = title.slice( startHighlightIndex, endHighlightIndex );
			const beforeHighlight = title.slice( 0, Math.max( 0, startHighlightIndex ) );
			const aferHighlight = title.slice( endHighlightIndex, title.length );
			formattedTitle = beforeHighlight + mw.html.element( 'em', { class: 'suggestion-highlight' }, strong ) + aferHighlight;
		}

		return formattedTitle;
	} // END highlightTitle

	/**
	 * Generates a template string based on an array of search suggestions.
	 *
	 * @param {Array} suggestions - An array of search suggestion results.
	 * @return {string} A string representing the search suggestions DOM
	 */
	function generateTemplateString( suggestions ) {
		let string = '<div class="suggestions-dropdown">',
			sanitizedThumbURL = false,
			descriptionText = '',
			pageDescription = '';

		for ( let i = 0; i < suggestions.length; i++ ) {

			if ( !suggestions[ i ] ) {
				continue;
			}

			const page = suggestions[ i ];
			pageDescription = page.description || '';

			// Ensure that the value from the previous iteration isn't used
			sanitizedThumbURL = false;

			if ( page.thumbnail && page.thumbnail.source ) {
				sanitizedThumbURL = page.thumbnail.source.replace( /"/g, '%22' );
				sanitizedThumbURL = sanitizedThumbURL.replace( /'/g, '%27' );
			}

			// Ensure that the value from the previous iteration isn't used
			descriptionText = '';

			// Check if description exists
			if ( pageDescription ) {
				// If the description is an array, use the first item
				if ( typeof pageDescription === 'object' && pageDescription[ 0 ] ) {
					descriptionText = pageDescription[ 0 ].toString();
				} else {
					// Otherwise, use the description as is.
					descriptionText = pageDescription.toString();
				}
			}

			const suggestionDescription = mw.html.element( 'p', { class: 'suggestion-description' }, descriptionText );

			const suggestionTitle = mw.html.element( 'h3', { class: 'suggestion-title' }, new mw.html.Raw( highlightTitle( page.title, searchString ) ) );

			const suggestionText = mw.html.element( 'div', { class: 'suggestion-text' }, new mw.html.Raw( suggestionTitle + suggestionDescription ) );

			const suggestionThumbnail = mw.html.element( 'div', {
				class: 'suggestion-thumbnail',
				style: ( sanitizedThumbURL ) ? 'background-image:url(' + sanitizedThumbURL + ')' : false
			}, '' );

			const suggestionLink = mw.html.element( 'a', {
				class: 'suggestion-link',
				href: 'https://' + searchLang + '.' + portalSearchDomain + '/wiki/' + encodeURIComponent( page.title.replace( / /gi, '_' ) )
			}, new mw.html.Raw( suggestionText + suggestionThumbnail ) );

			string += suggestionLink;

		}

		string += '</div>';

		return string;
	} // END generateTemplateString

	/**
	 * - Removes 'active' class from a collection of elements.
	 * - Adds 'active' class to an item if missing.
	 * - Removes 'active' class from item if present.
	 *
	 * @param {HTMLElement} item Item to add active class to.
	 * @param {NodeList} collection Sibling items.
	 */

	function toggleActiveClass( item, collection ) {

		const activeClass = ' active'; // Prefixed with space.

		for ( let i = 0; i < collection.length; i++ ) {

			const colItem = collection[ i ];
			// Remove the class name from everything except item.
			if ( colItem !== item ) {
				colItem.className = colItem.className.replace( activeClass, '' );
			} else {
				// If item has class name, remove it
				if ( / active/.test( item.className ) ) {
					item.className = item.className.replace( activeClass, '' );
				} else {
					// It item doesn't have class name, add it.
					item.className += activeClass;
					ssActiveIndex.setIndex( i );
				}
			}
		}
	}

	/**
	 * Search API callback. Returns a closure that holds the index of the request.
	 * Deletes previous callbacks based on this index. This prevents callbacks for old
	 * requests from executing. Then:
	 *  - parses the search results
	 *  - generates the template String
	 *  - inserts the template string into the DOM
	 *  - attaches event listeners on each suggestion item.
	 *
	 * @param {number} callbackIndex
	 * @return {Function}
	 */
	window.portalOpensearchCallback = function ( callbackIndex ) {

		const orderedResults = [];

		return function ( xhrResults ) {

			window.callbackStack.deletePrevCallbacks( callbackIndex );

			if ( document.activeElement !== searchEl ) {
				return;
			}

			const suggestions = ( xhrResults.query && xhrResults.query.pages ) ?
				xhrResults.query.pages : [];

			for ( const item in suggestions ) {
				const result = suggestions[ item ];
				orderedResults[ result.index - 1 ] = result;
			}

			const templateDOMString = generateTemplateString( orderedResults );

			ssActiveIndex.setMax( orderedResults.length );
			ssActiveIndex.clear();

			typeAheadEl.innerHTML = templateDOMString;

			const typeAheadItems = typeAheadEl.childNodes[ 0 ].childNodes;

			// Attaching hover events
			for ( let i = 0; i < typeAheadItems.length; i++ ) {
				const listEl = typeAheadItems[ i ];
				// Requires the global polyfill
				listEl.addEventListener( 'mouseenter', toggleActiveClass.bind( this, listEl, typeAheadItems ) );
				listEl.addEventListener( 'mouseleave', toggleActiveClass.bind( this, listEl, typeAheadItems ) );
			}
		};
	};

	/**
	 * Keyboard events: up arrow, down arrow and enter.
	 * moves the 'active' suggestion up and down.
	 *
	 * @param {event} event
	 */
	function keyboardEvents( event ) {

		const e = event || window.event,
			keycode = e.which || e.keyCode;

		if ( !typeAheadEl.firstChild ) {
			return;
		}

		let activeItem;
		if ( keycode === 40 || keycode === 38 ) {
			const suggestionItems = typeAheadEl.firstChild.childNodes;

			let searchSuggestionIndex;
			if ( keycode === 40 ) {
				searchSuggestionIndex = ssActiveIndex.increment( 1 );
			} else {
				searchSuggestionIndex = ssActiveIndex.increment( -1 );
			}

			// (T279994) NewFeature:-Autofill search suggestion by using key up and key down event
			const suggestiontitle =
				suggestionItems[ searchSuggestionIndex ].firstChild.childNodes[ 0 ];
			searchEl.value = suggestiontitle.textContent;

			activeItem = ( suggestionItems ) ? suggestionItems[ searchSuggestionIndex ] : false;

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

	searchEl.addEventListener( 'keydown', keyboardEvents );

	window.addEventListener( 'click', ( event ) => {
		const target = event.target.closest( '#search-form' );

		if ( !target ) {
			clearTypeAhead();
		}
	} );

	return {
		typeAheadEl: typeAheadEl,
		query: loadQueryScript
	};
};
