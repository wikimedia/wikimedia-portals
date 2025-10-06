/**
 * This is the JavaScript module for the [[m:Project portals]] templates.
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
 * Validate with ESLint.
 *
 */
/* global doWhenReady, getIso639, getDevicePixelRatio */

( function () {
	'use strict';

	/**
	 * Returns the DOM element with the given ID.
	 *
	 * @param {string} id
	 * @return {HTMLElement}
	 */
	function $( id ) {
		return document.getElementById( id );
	}

	/**
	 * Replaces the “hero graphic” with the given language edition’s logo.
	 *
	 * @param {string} lang
	 */
	function updateBranding( lang ) {
		// Only Wiktionary has such a mess of logos.
		if (
			!document.querySelector ||
			document.body.id !== 'www-wiktionary-org' ||
			lang.match( /\W/ )
		) {
			return;
		}

		const option = document.querySelector( 'option[lang|="' + lang + '"]' );
		const logo = option && option.getAttribute( 'data-logo' );
		if ( logo ) {
			document.body.setAttribute( 'data-logo', logo );
		}
	}

	/**
	 * Preconnects to the search target wiki
	 *
	 * @param {string} lang
	 */
	function preconnect( lang ) {
		const link = document.createElement( 'link' ),
			domain = window.location.hostname.split( '.' ),
			tld = domain.pop(),
			sld = domain.pop();
		link.rel = 'preconnect';
		link.href = '//' + lang + '.' + sld + '.' + tld;
		document.head.appendChild( link );
	}

	/**
	 * Returns the user's preferred language according to browser preferences.
	 *
	 * @return {string}
	 */
	function getUALang() {
		const uiLang = ( navigator.languages && navigator.languages[ 0 ] ) ||
		navigator.language || navigator.userLanguage || '';
		return uiLang.toLowerCase().split( '-' )[ 0 ];
	}

	/**
	 * Returns the preferred language as stored in a cookie. Falls back on the
	 * browser's language.
	 *
	 * @return {string}
	 */
	function getSavedLang() {
		const match = document.cookie.match( /(?:^|\W)searchLang=([^;]+)/ );
		return ( match ? match[ 1 ] : getUALang() ).toLowerCase();
	}

	/**
	 * Selects the language from the dropdown according to the user's preference.
	 */
	doWhenReady( () => {
		const lang = getSavedLang();

		if ( !lang ) {
			return;
		}

		const iso639 = getIso639( lang );

		const select = $( 'searchLanguage' );
		// Verify that an <option> exists for the langCode that was
		// In the cookie. If so, set the value to it.
		if ( select ) {
			const options = select.getElementsByTagName( 'option' );
			let matchingLang;
			for ( let i = 0, len = options.length; !matchingLang && i < len; i += 1 ) {
				if ( options[ i ].value === iso639 ) {
					matchingLang = iso639;
				}
			}
			if ( !matchingLang && document.querySelector ) {
				const matchingLink = document.querySelector( '.langlist a[lang|="' + iso639 + '"]' );
				if ( matchingLink ) {
					matchingLang = iso639;
					const customOption = document.createElement( 'option' );
					customOption.setAttribute( 'lang', iso639 );
					customOption.setAttribute( 'value', iso639 );
					const customOptionText =
						matchingLink.textContent || matchingLink.innerText || iso639;
					customOption.textContent = customOptionText;
					select.appendChild( customOption );
				}
			}
			if ( matchingLang ) {
				select.value = matchingLang;
				updateBranding( matchingLang );
				preconnect( matchingLang );
			}
		}
	} );

	/**
	 * Stores the user's preferred language in a cookie. This function is called
	 * once a language other than the browser's default is selected from the
	 * dropdown.
	 *
	 * @param {string} lang
	 */
	function setLang( lang ) {
		if ( !lang ) {
			return;
		}

		const uiLang = getUALang();
		const match = uiLang.match( /^\w+/ );
		const date = new Date();

		updateBranding( lang );
		if ( match && match[ 0 ] === lang ) {
			date.setTime( date.getTime() - 1 );
		} else {
			date.setFullYear( date.getFullYear() + 1 );
		}

		document.cookie = 'searchLang=' + lang + ';expires=' +
			date.toUTCString() + ';domain=' + location.host + ';';
	}

	doWhenReady( () => {
		const search = $( 'searchInput' ),
			select = $( 'searchLanguage' );

		if ( search ) {
			if ( search.autofocus === undefined ) {
				// Focus the search box.
				search.focus();
			} else {
				// Autofocus causes scrolling in most browsers that support it.
				window.scroll( 0, 0 );
			}

			// Prefills the search box with the "search" URL parameter.
			const params = location.search && location.search.slice( 1 ).split( '&' );
			for ( let i = 0; i < params.length; i += 1 ) {
				const param = params[ i ].split( '=' );
				if ( param[ 0 ] === 'search' && param[ 1 ] ) {
					search.value = decodeURIComponent( param[ 1 ].replace( /\+/g, ' ' ) );
					break;
				}
			}
		}

		select.addEventListener( 'change', () => {
			select.blur();
			setLang( select.value );
		} );
	} );

	doWhenReady( () => {
		const uselang = document.searchwiki && document.searchwiki.elements.uselang;
		if ( uselang ) {
			// Don't use getSavedLang() since that uses the cookie for the search form.
			// The searchwiki form should not be affected by the values in the searchpage form.
			uselang.value = getUALang();
		}
	} );

	// Based on jquery.hidpi module with jQuery removed & support for full srcset syntax added.

	/**
	 * Matches a srcset entry for the given device pixel ratio.
	 *
	 * @param {number} devicePixelRatio
	 * @param {string} srcset
	 * @return {Mixed} null or the matching src string
	 */
	function matchSrcSet( devicePixelRatio, srcset ) {
		const selection = { ratio: 1 };
		const candidates = srcset.split( / *, */ );
		for ( let i = 0; i < candidates.length; i++ ) {
			// http://www.w3.org/html/wg/drafts/srcset/w3c-srcset/#additions-to-the-img-element
			const candidate = candidates[ i ].match( /\s*(\S+)(?:\s*([\d.]+)w)?(?:\s*([\d.]+)h)?(?:\s*([\d.]+)x)?\s*/ );
			const ratio = candidate[ 4 ] && parseFloat( candidate[ 4 ] );
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
		const ratio = getDevicePixelRatio(),
			testImage = new Image();

		if ( ratio > 1 && testImage.srcset === undefined ) {
			// No native srcset support.
			const imgs = document.getElementsByTagName( 'img' );
			for ( let i = 0; i < imgs.length; i++ ) {
				const img = imgs[ i ];
				const srcset = img.getAttribute( 'srcset' );
				if ( typeof srcset === 'string' && srcset !== '' ) {
					const match = matchSrcSet( ratio, srcset );
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

}() );

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
