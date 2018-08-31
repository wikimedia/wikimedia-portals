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
/* global addEvent, doWhenReady, getIso639, getDevicePixelRatio */

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
		var option, logo;

		// Only Wiktionary has such a mess of logos.
		if (
			!document.querySelector ||
			document.body.id !== 'www-wiktionary-org' ||
			lang.match( /\W/ )
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
	 * Preconnects to the search target wiki
	 *
	 * @param {string} lang
	 */
	function preconnect( lang ) {
		var link = document.createElement( 'link' ),
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
		var uiLang = ( navigator.languages && navigator.languages[ 0 ] ) ||
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
	 *
	 * @param {string} lang
	 */
	function convertChinese( lang ) {
		var i, elt,
			txtAttr = 'data-convert-hans',
			titleAttr = 'data-converttitle-hans',
			ids;

		if ( 'zh-hans,zh-cn,zh-sg,zh-my,'.indexOf( lang + ',' ) === -1 ) {
			return;
		}

		// If we ever drop support for IE 8 and below, we can put all these
		// elements in a 'convertible' class and call
		// document.getElementsByClassName() instead.
		ids = [ 'zh_art', 'zh_others', 'zh_search', 'zh_tag', 'zh_top10', 'zh-yue_wiki', 'gan_wiki', 'hak_wiki', 'wuu_wiki' ];
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
	 *
	 * @param {string} lang
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

		iso639 = getIso639( lang );

		select = $( 'searchLanguage' );
		// Verify that an <option> exists for the langCode that was
		// in the cookie. If so, set the value to it.
		if ( select ) {
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
		var uiLang,
			match,
			date;

		if ( !lang ) {
			return;
		}

		uiLang = getUALang();
		match = uiLang.match( /^\w+/ );
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

		addEvent( select, 'change', function () {
			select.blur();
			setLang( select.value );
		} );
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
		var imgs,
			img,
			srcset,
			match,
			i,
			ratio = getDevicePixelRatio(),
			testImage = new Image();

		if ( ratio > 1 && testImage.srcset === undefined ) {
			// No native srcset support.
			imgs = document.getElementsByTagName( 'img' );
			for ( i = 0; i < imgs.length; i++ ) {
				img = imgs[ i ];
				srcset = img.getAttribute( 'srcset' );
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
