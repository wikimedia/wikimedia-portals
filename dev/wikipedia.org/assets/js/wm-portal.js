/**
 * This is the javascript module for the [[m:Project portals]] templates.
 *
 * Indention style: 1 tab
 *
 * Beware: This is used not only for www.wikipedia.org, but also for sister projects
 * like www.wiktionary.org and for portals without bookshelves like www.wikimedia.org.
 *
 * Warning: "mediaWiki" and "jQuery" are NOT available here. This is used outside
 * mediawiki-software output context, on the [[m:Project portals]] HTML pages.
 *
 * Don't be afraid to supplement code with comments, this script is loaded through
 * ResourceLoader on the portal pages and as such is minified and squeezed into a
 * tiny package served from load.php
 *
 * Validate with JSLint or JSHint.
 *
 */
/* global _ */
/* global wmTest */
( function ( wmTest ) {
	'use strict';

	var attachedEvents = [];

	/**
	 * Returns the DOM element with the given ID.
	 */
	function $( id ) {
		return document.getElementById( id );
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
	 * Replaces the “hero graphic” with the given language edition’s logo.
	 */
	function updateBranding( lang ) {
		var option, logo;

		// Only Wiktionary has such a mess of logos.
		if ( !document.querySelector
			|| document.body.id !== 'www-wiktionary-org'
			|| lang.match( /\W/ )
		) {
			return;
		}

		option = document.querySelector( 'option[lang|="' + lang + '"]' );
		logo = option && option.getAttribute( 'data-logo' );
		if ( logo ) {
			document.body.setAttribute( 'data-logo', logo );
		}
	}

	/**
	 * Returns the user's preferred language according to browser preferences.
	 */
	function getUALang() {
		var uiLang = ( navigator.languages && navigator.languages[ 0 ] ) ||
		navigator.language || navigator.userLanguage || '';
		return uiLang.toLowerCase().split( '-' )[ 0 ];
	}

	/**
	 * Returns the preferred language as stored in a cookie. Falls back on the
	 * browser's language.
	 */
	function getSavedLang() {
		var match = document.cookie.match( /(?:^|\W)searchLang=([^;]+)/ );
		return ( match ? match[ 1 ] : getUALang() ).toLowerCase();
	}

	/**
	 * Imitates `element.textContent = text` for back-compatibility.
	 *
	 * @param {HTMLElement} element
	 * @param {string} text
	 */
	function textContent( element, text ) {
		while ( element.firstChild ) {
			element.removeChild( element.firstChild );
		}
		element.appendChild( document.createTextNode( text ) );
	}

	/**
	 * Converts Chinese strings from traditional to simplified.
	 *
	 * Convertible elements start out with traditional text and title attributes
	 * along with simplified counterparts in the data-*-hans attributes.
	 */
	function convertChinese( lang ) {
		var i, elt,
			txtAttr = 'data-convert-hans',
			titleAttr = 'data-converttitle-hans';

		if ( 'zh-hans,zh-cn,zh-sg,zh-my,'.indexOf( lang + ',' ) === -1 ) {
			return;
		}

		// If we ever drop support for IE 8 and below, we can put all these
		// elements in a 'convertible' class and call
		// document.getElementsByClassName() instead.
		var ids = [ 'zh_art', 'zh_others', 'zh_search', 'zh_tag', 'zh_top10', 'zh-yue_wiki', 'gan_wiki', 'hak_wiki', 'wuu_wiki' ];
		for ( i = 0; i < ids.length; i += 1 ) {
			elt = $( ids[ i ] );
			if ( elt ) {
				if ( elt.hasAttribute( txtAttr ) ) {
					// HTML escaping for paranoia, as it should all be text anyways.
					textContent( elt, elt.getAttribute( txtAttr ) );
				}
				if ( elt.hasAttribute( titleAttr ) ) {
					elt.title = elt.getAttribute( titleAttr );
				}
			}
		}
	}

	/**
	 * Modifies links to the Chinese language edition to point to traditional or
	 * simplified versions, based on the user's preference.
	 */
	function convertZhLinks( lang ) {
		var locale;

		if ( lang.indexOf( 'zh' ) !== 0 ) {
			return;
		}

		locale = lang.substring( 3 /* 'zh-'.length */ );
		if ( locale === 'mo' ) {
			locale = 'hk';
		} else if ( locale === 'my' ) {
			locale = 'sg';
		}

		if ( locale && 'cn,tw,hk,sg,'.indexOf( locale + ',' ) >= 0 ) {
			$( 'zh_wiki' ).href += 'zh-' + locale + '/';
			$( 'zh_others' ).href = $( 'zh_others' ).href.replace( 'wiki/', 'zh-' + locale + '/' );
		}

		convertChinese( lang );
	}

	/**
	 * Selects the language from the dropdown according to the user's preference.
	 */
	doWhenReady( function () {
		var iso639, select, options, i, len, matchingLang, matchingLink,
			customOption, customOptionText,
			lang = getSavedLang();

		if ( !lang ) {
			return;
		}

		convertZhLinks( lang );

		iso639 = lang.match( /^\w+/ );
		if ( !iso639 ) {
			return;
		}
		iso639 = ( iso639[ 0 ] === 'nb' ) ? 'no' : iso639[ 0 ];
		select = $( 'searchLanguage' );
		// Verify that an <option> exists for the langCode that was
		// in the cookie. If so, set the value to it.
		if ( select && select.tagName === 'SELECT' ) {
			options = select.getElementsByTagName( 'option' );
			for ( i = 0, len = options.length; !matchingLang && i < len; i += 1 ) {
				if ( options[ i ].value === iso639 ) {
					matchingLang = iso639;
				}
			}
			if ( !matchingLang && document.querySelector ) {
				matchingLink = document.querySelector( '.langlist a[lang|="' + iso639 + '"]' );
				if ( matchingLink ) {
					matchingLang = iso639;
					customOption = document.createElement( 'option' );
					customOption.setAttribute( 'lang', iso639 );
					customOption.setAttribute( 'value', iso639 );
					customOptionText = matchingLink.textContent || matchingLink.innerText || iso639;
					textContent( customOption, customOptionText );
					select.appendChild( customOption );
				}
			}
			if ( matchingLang ) {
				select.value = matchingLang;
				updateBranding( matchingLang );
			}
		} else if ( wmTest.abtest1 && select && select.tagName === 'UL' ) {
			var lis = select.getElementsByTagName( 'li' );
			for ( i = 0, len = lis.length; !matchingLang && i < len; i += 1 ) {
				if ( lis[ i ].firstChild.getAttribute( 'data-lang-value' ) === iso639 ) {
					matchingLang = iso639;
				}
			}
			if ( !matchingLang && document.querySelector ) {
				matchingLink = document.querySelector( '.langlist a[lang|="' + iso639 + '"]' );
				if ( matchingLink ) {
					matchingLang = iso639;
					var customLi = document.createElement( 'li' ),
						customA = document.createElement( 'a' );
					customA.setAttribute( 'lang', iso639 );
					customA.setAttribute( 'data-lang-value', iso639 );
					textContent( customA, matchingLink.textContent || matchingLink.innerText || iso639 );
					customLi.appendChild( customA );
					select.appendChild( customLi );
				}
			}
			if ( matchingLang ) {
				select.setAttribute( 'data-lang-value', matchingLang );
				textContent( document.getElementById( 'selectedLanguageCode' ), iso639.toUpperCase() );
				document.getElementById( 'hiddenLanguageInput' ).value = matchingLang;

				var activeLi = document.querySelector( '#searchLanguage .selected' ),
					newActiveLi = document.querySelector( '#searchLanguage [lang="' + matchingLang + '"]' );
				if ( activeLi ) {
					activeLi.className = '';
				}
				if ( newActiveLi ) {
					newActiveLi.parentNode.className = 'selected';
				}
				updateBranding( matchingLang );
			}
		}
	} );

	/**
	 * Invokes the MediaWiki API of the selected wiki to search for articles
	 * whose titles begin with the entered text.
	 */
	function setupSuggestions() {
		// For simplicity's sake, rely on the HTML5 <datalist> element available
		// on IE 10+ (and all other modern browsers).
		if ( window.HTMLDataListElement === undefined ) {
			return;
		}

		var list = document.createElement( 'datalist' ),
			search = $( 'searchInput' );

		list.id = 'suggestions';
		document.body.appendChild( list );
		search.autocomplete = 'off';
		search.setAttribute( 'list', 'suggestions' );

		addEvent( search, 'input', _.debounce( function () {
			var head = document.getElementsByTagName( 'head' )[ 0 ],
				language,
				hostname,
				script = $( 'api_opensearch' ),
				query = encodeURIComponent( search.value );

			if ( wmTest.abtest1 ) {
				language = $( 'searchLanguage' ).getAttribute( 'data-lang-value' );
			} else {
				language = $( 'searchLanguage' ).value;
			}
			hostname = window.location.hostname.replace( 'www.', language + '.' );

			if ( script ) {
				head.removeChild( script );
			}
			script = document.createElement( 'script' );
			script.id = 'api_opensearch';
			script.src = '//' + encodeURIComponent( hostname ) + '/w/api.php?action=opensearch&limit=10&format=json&callback=portalOpensearchCallback&search=' + query;
			head.appendChild( script );
		}, 200 ) );
	}

	/**
	 * Sets the search box's data list to the results returned by the MediaWiki
	 * API. The results are returned in JSON-P format, so this callback must be
	 * global.
	 */
	window.wmSuggestionsEL = null; // cache the suggestions dom.
	window.portalOpensearchCallback = _.debounce( function ( xhrResults ) {
		var i,
			suggestions = window.wmSuggestionsEL || $( 'suggestions' ),
			oldOptions = suggestions.children,
			fragment = document.createDocumentFragment();

		// Update the list, reusing any existing items from the last search.
		for ( i = 0; i < xhrResults[ 1 ].length; i += 1 ) {
			var option = oldOptions[ i ] || document.createElement( 'option' );
			option.value = xhrResults[ 1 ][ i ];
			if ( !oldOptions[ i ] ) {
				fragment.appendChild( option );
			}
		}

		suggestions.appendChild( fragment.cloneNode( true ) );
	}, 100 );

	/**
	 * Stores the user's preferred language in a cookie. This function is called
	 * once a language other than the browser's default is selected from the
	 * dropdown.
	 */
	function setLang( lang ) {
		if ( !lang ) {
			return;
		}
		var uiLang = getUALang(),
			match = uiLang.match( /^\w+/ ),
			date = new Date();

		updateBranding( lang );
		if ( match && match[ 0 ] === lang ) {
			date.setTime( date.getTime() - 1 );
		} else {
			date.setFullYear( date.getFullYear() + 1 );
		}

		document.cookie = 'searchLang=' + lang + ';expires=' +
			date.toUTCString() + ';domain=' + location.host + ';';
	}

	doWhenReady( function () {
		var params, i, param,
			search = $( 'searchInput' ),
			select = $( 'searchLanguage' );

		if ( search ) {
			// Add a search icon to the box in Safari.
			search.setAttribute( 'results', '10' );
			setupSuggestions();

			if ( search.autofocus === undefined ) {
				// Focus the search box.
				search.focus();
			} else {
				// autofocus causes scrolling in most browsers that
				// support it.
				window.scroll( 0, 0 );
			}

			// Prefills the search box with the "search" URL parameter.
			params = location.search && location.search.substr( 1 ).split( '&' );
			for ( i = 0; i < params.length; i += 1 ) {
				param = params[ i ].split( '=' );
				if ( param[ 0 ] === 'search' && param[ 1 ] ) {
					search.value = decodeURIComponent( param[ 1 ].replace( /\+/g, ' ' ) );
					break;
				}
			}
		}

		if ( !wmTest.abtest1 ) {
			addEvent( select, 'change', function () {
				setLang( select.value );
			} );
		}
	} );

	doWhenReady( function () {
		var uselang = document.searchwiki && document.searchwiki.elements.uselang;
		if ( uselang ) {
			// Don't use getSavedLang() since that uses the cookie for the search form.
			// The searchwiki form should not be affected by the values in the searchpage form.
			uselang.value = getUALang();
		}
	} );

	// Based on jquery.hidpi module with the jQuery removed and support for the
	// full srcset syntax added.

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
	function devicePixelRatio() {
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

	/**
	 * Matches a srcset entry for the given device pixel ratio.
	 *
	 * @param {number} devicePixelRatio
	 * @param {string} srcset
	 * @return {mixed} null or the matching src string
	 */
	function matchSrcSet( devicePixelRatio, srcset ) {
		var candidates,
			candidate,
			i,
			ratio,
			selection = { ratio: 1 };
		candidates = srcset.split( / *, */ );
		for ( i = 0; i < candidates.length; i++ ) {
			// http://www.w3.org/html/wg/drafts/srcset/w3c-srcset/#additions-to-the-img-element
			candidate = candidates[ i ].match( /\s*(\S+)(?:\s*([\d.]+)w)?(?:\s*([\d.]+)h)?(?:\s*([\d.]+)x)?\s*/ );
			ratio = candidate[ 4 ] && parseFloat( candidate[ 4 ] );
			if ( ratio <= devicePixelRatio && ratio > selection.ratio ) {
				selection.ratio = ratio;
				selection.src = candidate[ 1 ];
				selection.width = candidate[ 2 ] && parseFloat( candidate[ 2 ] );
				selection.height = candidate[ 3 ] && parseFloat( candidate[ 3 ] );
			}
		}
		return selection;
	}

	/**
	 * Implements responsive images based on srcset attributes, if browser has
	 * no native srcset support.
	 */
	function hidpi() {
		var imgs, i,
			ratio = devicePixelRatio(),
			testImage = new Image();

		if ( ratio > 1 && testImage.srcset === undefined ) {
			// No native srcset support.
			imgs = document.getElementsByTagName( 'img' );
			for ( i = 0; i < imgs.length; i++ ) {
				var img = imgs[ i ],
					srcset = img.getAttribute( 'srcset' ),
					match;
				if ( typeof srcset === 'string' && srcset !== '' ) {
					match = matchSrcSet( ratio, srcset );
					if ( match.src !== undefined ) {
						img.setAttribute( 'src', match.src );
						if ( match.width !== undefined ) {
							img.setAttribute( 'width', match.width );
						}
						if ( match.height !== undefined ) {
							img.setAttribute( 'height', match.height );
						}
					}
				}
			}
		}
	}

	doWhenReady( hidpi );

	doWhenReady( function () {
		if ( !wmTest.abtest1 ) {
			return;
		}

		/**
		 * The dropdown containing the language selection
		 *
		 * @type {HTMLElement}
		 * @private
		 */
		var dropdown = document.getElementById( 'searchLanguage' ),

			/**
			 * The button to toggle the language selection dropdown.
			 *
			 * @type {HTMLElement}
			 * @private
			 */
			lpButton = document.querySelector( '.language-picker' ),

			/**
			 * The element that contains the text for the selected language code.
			 *
			 * @type {HTMLElement}
			 * @private
			 */
			selectedLanguageEl = document.getElementById( 'selectedLanguageCode' ),

			/**
			 * The search input.
			 *
			 * @type {HTMLElement}
			 * @private
			 */
			searchInput = document.getElementById( 'searchInput' ),

			/**
			 * Key code -> actual letter map
			 *
			 * @type {Object}
			 * @private
			 */
			keyCodeMap = {
				48: '0',
				49: '1',
				50: '2',
				51: '3',
				52: '4',
				53: '5',
				54: '6',
				55: '7',
				56: '8',
				57: '9',
				59: ';',
				65: 'a',
				66: 'b',
				67: 'c',
				68: 'd',
				69: 'e',
				70: 'f',
				71: 'g',
				72: 'h',
				73: 'i',
				74: 'j',
				75: 'k',
				76: 'l',
				77: 'm',
				78: 'n',
				79: 'o',
				80: 'p',
				81: 'q',
				82: 'r',
				83: 's',
				84: 't',
				85: 'u',
				86: 'v',
				87: 'w',
				88: 'x',
				89: 'y',
				90: 'z',
				96: '0',
				97: '1',
				98: '2',
				99: '3',
				100: '4',
				101: '5',
				102: '6',
				103: '7',
				104: '8',
				105: '9'
			},

			/**
			 * Hash giving language properties for the first character of the language name.
			 *
			 *
			 * @type {Object}
			 * @type {number} type.nodeId
			 * @type {string} type.code
			 * @type {string} type.lang
			 * @type {string} type.label
			 */
			langByFirstLetter = {};

		/**
		 * Binds events to navigate within the dropdown with keyboard arrow keys.
		 *
		 * @private
		 */
		function bindNavigationEvents() {
			addEvent( document, 'keydown', highlightListItem );
			addEvent( document, 'mouseover', highlightListItem );
		}

		/**
		 * Unbinds events added by {@link #bindNavigationEvents}.
		 *
		 * @private
		 */
		function unbindNavigationEvents() {
			removeEvent( document, 'keydown', highlightListItem );
			removeEvent( document, 'mouseover', highlightListItem );
		}

		/**
		 * Scrolls the dropdown to position the active element in the middle of the dropdown.
		 *
		 * @param {HTMLElement} [activeLi]
		 * @private
		 */
		function optimizeScrollTo( activeLi ) {
			activeLi = activeLi || document.querySelector( '#searchLanguage .selected' );

			var currentScrollTop = dropdown.scrollTop,
				newScrollTop,
				activeLiPosition = activeLi.offsetTop,
				dropdownHeight = dropdown.clientHeight,
				activeLiHeight = activeLi.clientHeight;

			if ( currentScrollTop > activeLiPosition ) {
				// scroll up to the active li position
				newScrollTop = activeLiPosition;
			} else {
				// scroll down
				newScrollTop = activeLiPosition;
				newScrollTop -= ( dropdownHeight / 2 ); // scroll up a bit so
				newScrollTop += activeLiHeight; // the active element is in the middle.
			}
			dropdown.scrollTop = newScrollTop;
		}

		/**
		 * Highlights the right item when a `click` or `mouseover` event happens.
		 *
		 * @param {Event} e The `click` or `mouseover` event.
		 * @private
		 */
		function highlightListItem( e ) {

			e = e || window.event;

			var up = 40,
				down = 38,
				enter = 13,
				tab = 9,
				esc = 27,
				activeLi = document.querySelector( '#searchLanguage li.selected' ) || document.querySelector( '#searchLanguage li' ),
				scroll = true,
				previousLi = activeLi,
				charCode = e.which || e.keyCode,
				target = e.target || e.srcElement;

			if ( charCode === up ) {
				activeLi = activeLi.nextElementSibling || activeLi;
			} else if ( charCode === down ) {
				activeLi = activeLi.previousElementSibling || activeLi;
			} else if ( target.tagName === 'A' && target.parentNode.parentNode.id === 'searchLanguage' ) {
				activeLi = target.parentNode;
				scroll = false;
			} else if ( charCode === tab ) { // e.type === 'keydown'
				lp.close();
				return;
			} else if ( charCode === esc ) {
				lp.close();
				return;
			} else if ( charCode === enter ) { // e.type === 'keydown'
				onLanguageChanged( lp.getLanguage() );
				lp.close();
				return;
			} else if ( keyCodeMap[ charCode ] && langByFirstLetter[ keyCodeMap[ charCode ] ] ) {
				activeLi = dropdown.childNodes[ langByFirstLetter[ keyCodeMap[ charCode ] ].nodeId ];
			} else {
				return;
			}

			if ( e.preventDefault ) {
				e.preventDefault();
			} else {
				e.returnValue = false;
			}

			previousLi.className = '';
			activeLi.className = 'selected';

			if ( scroll ) {
				optimizeScrollTo( activeLi );
			}

		}

		/**
		 * Binds click events happening within the dropdown.
		 *
		 * @private
		 */
		function bindClickEvents() {
			dropdown.onclick = function () {
				onLanguageChanged( lp.getLanguage() );
			};

			addEvent( document, 'click', lp.close );
		}

		/**
		 * Unbinds events added by {@link #bindClickEvents}.
		 *
		 * @private
		 */
		function unbindClickEvents() {
			dropdown.onclick = null;
			removeEvent( document, 'click', lp.close );
		}

		/**
		 * Updates the selected language displayed in the language picker button.
		 *
		 * @param {string} lang
		 */
		function onLanguageChanged( lang ) {
			selectedLanguageEl.innerHTML = lang.toUpperCase();
			lpButton.className = 'language-picker flash-text';
			document.getElementById( 'hiddenLanguageInput' ).value = lang;
			setLang( lang );
			// delay otherwise the form gets submitted if user selects language by pressing `enter`.
			setTimeout( function () {
				searchInput.focus();
			} );
		}

		var lp = {};

		/**
		 * Gets the selected language key.
		 *
		 * @return {string} The language key.
		 */
		lp.getLanguage = function () {
			return document.querySelector( '.selected > a' ).getAttribute( 'lang' ) ||
				document.querySelector( '.selected > a' ).getAttribute( 'data-lang-value' );
		};

		/**
		 * Opens the language picker dropdown.
		 */
		lp.open = function () {
			bindNavigationEvents();
			bindClickEvents();
			var windowScroll = window.pageYOffset,
				viewPortHeight = window.innerHeight,
				distanceToTop = searchInput.offsetParent.offsetTop,
				ddSize = 192;

			if ( ( distanceToTop + ddSize - windowScroll ) > viewPortHeight ) {
				dropdown.className = 'open dropup';
			} else {
				dropdown.className = 'open';
			}
			lpButton.className = 'language-picker active';
			optimizeScrollTo();
		};

		/**
		 * Closes the language picker dropdown.
		 */
		lp.close = function () {
			unbindNavigationEvents();
			unbindClickEvents();
			dropdown.className = '';
			if ( lpButton.className === 'language-picker active' ) {
				lpButton.className = 'language-picker';
			}
			lpButton.blur();
		};

		/**
		 * Initializes the language picker widget.
		 *
		 * - Binds language picker button events to open the dropdown.
		 * - Parses the dropdown and builds the {@link #langByFirstLetter} convenient hash.
		 *
		 * @private
		 */
		function init() {
			// to avoid competition between `focus` and `click`
			lpButton.onclick = function ( e ) {
				e = e || window.event;
				if ( e.stopPropagation ) {
					e.stopPropagation();
				} else {
					e.cancelBubble = false;
				}
			};

			// click triggers focus, and focus handles opening the dropdown
			lpButton.onfocus = function () {
				lp.open();
			};

			var li,
				firstLetter;

			// Parse all the languages that are in the language dropdown
			for ( var i = 0; i < dropdown.childNodes.length; i++ ) {
				li = dropdown.childNodes[ i ];
				if ( li.tagName !== 'LI' ) {
					continue;
				}
				firstLetter = li.firstChild.innerHTML.toLowerCase().substr( 0, 1 );
				if ( li.firstChild.getAttribute( 'data-lang-value' ) && !langByFirstLetter[ firstLetter ]
				) {
					// keep a ref of the first node that starts with this first letter.
					langByFirstLetter[ firstLetter ] = {
						nodeId: i,
						lang: li.firstChild.getAttribute( 'lang' ),
						code: li.firstChild.getAttribute( 'data-lang-value' ),
						label: li.firstChild.innerHTML
					};
				}
			}
		}

		init();

		return lp;
	} );

}( wmTest ) );

/*
 * Depending on how this script is loaded, it may not have
 * the mediaWiki global object.  Simulate if needed, for the
 * load.php?only=scripts response that calls mw.loader.state(.., ..);
 */
if ( !window.mw ) {
	window.mw = window.mediaWiki = {
		loader: {
			state: function () {
			}
		}
	};
}
