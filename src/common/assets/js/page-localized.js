/* global wmTest, translationsHash, translationsPortalKey, wmL10nVisible, rtlLangs,
 portalSearchDomain */

/**
 * This script localizes the page text.
 * Text includes the footer text, language button text, sister project name & slogan.
 *
 * Each localized text node is given a class name that corresponds to a property
 * in the translation JSON object.
 *
 * eg: the class `jsl10n_wiktionary_name` will be translated to en.wikitionary.name value.
 * If a translation value is missing, page will default to english.
 *
 * @param {Object} wmTest
 * @param {string} translationsHash
 * @param {Object} mw
 * @param {Array} rtlLangs
 */

( function ( wmTest, translationsHash, mw, rtlLangs ) {

	var primaryLang = wmTest.primaryLang,
		storedTranslationHash,
		storedTranslations,
		l10nReq,
		l10nInfo;

	/**
	 * Helper function to safely parse JSON an return empty string on error.
	 *
	 * @param {JSON} json
	 * @return {JSON}
	 */
	function safelyParseJSON( json ) {
		var parsed;
		try {
			parsed = JSON.parse( json );
		} catch ( e ) {
			parsed = '';
		}
		return parsed;
	}

	function isValidHash() {
		var storedHash = mw.storage.get( 'translationHash' );
		return ( translationsHash === storedHash ) ? storedHash : false;
	}

	if ( primaryLang === 'en' ) {
		wmL10nVisible.makeVisible();
		return;
	}

	storedTranslationHash = isValidHash();
	storedTranslations = storedTranslationHash ? safelyParseJSON( mw.storage.get( 'storedTranslations' ) ) || {} : {};

	/**
	 * Saves translation to localstorage
	 *
	 * @param {string} lang language code that acts as the key to the translation.
	 * @param {Object} translation translation data.
	 */
	function saveTranslation( lang, translation ) {
		var translations = safelyParseJSON( mw.storage.get( 'storedTranslations' ) ) || {};

		translations[ lang ] = translation;
		mw.storage.set( 'storedTranslations', JSON.stringify( translations ) );
	}

	/**
	 * Takes an object and a string 'foo.bar' and returns object.foo.bar if exists,
	 * otherwise returns `undefined`.
	 *
	 * @param {Object} obj The object to traverse.
	 * @param {string} keys A string representing the dot notation of the object.
	 *
	 * @return {Mixed}
	 */
	function getProp( obj, keys ) {
		var i = 0;
		keys = String( keys ).split( '.' );
		while ( i < keys.length ) {
			if ( obj === undefined || obj === null ) {
				return undefined;
			}
			obj = obj[ keys[ i++ ] ];
		}
		return obj;
	}

	/**
	 * Takes the translation data object and replaces corresponding
	 * DOM element textContent with translation values.
	 *
	 * @param {Object} info Object containing translation data.
	 */
	function replacel10nText( info ) {
		var domEls = document.querySelectorAll( '.jsl10n' ),
			validAnchor = new RegExp( /<a[^>]*>([^<]+)<\/a>/ ),
			i, domEl, l10nAttr, textValue, termsHref, privacyHref;

		for ( i = 0; i < domEls.length; i++ ) {

			domEl = domEls[ i ];
			/**
			 * This converts the generic "portal" keyword in the data-jsl10n
			 * attributes e.g. 'data-jsl10n="portal.footer-description"' into a portal-specific
			 * keys as defined by the global `translationsPortalKey` variable inlined in index.html
			 */
			l10nAttr = domEl.getAttribute( 'data-jsl10n' ).replace( 'portal.', translationsPortalKey + '.' );
			textValue = getProp( info, l10nAttr );

			if ( typeof textValue === 'string' && textValue.length > 0 ) {
				switch ( l10nAttr ) {
					case 'app-links.other':
						if ( validAnchor.test( textValue ) ) {
							domEl.innerHTML = textValue;
						} else {
							domEl.firstChild.textContent = textValue;
						}
						break;
					case 'wikimedia-org-our-projects-desc':
					case 'wikimedia-org-wmf':
					case 'license':
						domEl.innerHTML = textValue;
						break;
					case 'terms':
						domEl.firstChild.textContent = textValue;
						termsHref = getProp( info, 'terms-link' );
						if ( termsHref ) {
							domEl.firstChild.setAttribute( 'href', termsHref );
						}
						break;
					case 'privacy-policy':
						domEl.firstChild.textContent = textValue;
						privacyHref = getProp( info, 'privacy-policy-link' );
						if ( privacyHref ) {
							domEl.firstChild.setAttribute( 'href', privacyHref );
						}
						break;
					default:
						domEl.textContent = textValue;
						// T254611 Specific 'lang' attribute for every localized text
						domEl.setAttribute( 'lang', info.lang );
						break;
				}
			}
		}
		wmL10nVisible.makeVisible();
	}

	function addHtmlLang( lang ) {
		document.documentElement.lang = lang;
		if ( rtlLangs.includes( lang ) ) {
			document.dir = 'rtl';
		} else {
			document.dir = 'ltr';
		}
	}
	/**
	 * If the primary language is not English, and the translation is missing or outdated,
	 * fetch the latest one.
	 */
	if ( !storedTranslations[ primaryLang ] ) {

		l10nReq = new XMLHttpRequest();

		l10nReq.open( 'GET', encodeURI( 'portal/' + portalSearchDomain + '/assets/l10n/' + primaryLang + '-' + translationsHash + '.json' ), true );

		l10nReq.onreadystatechange = function () {
			if ( l10nReq.readyState === 4 ) {
				if ( l10nReq.status === 200 ) {

					l10nInfo = safelyParseJSON( this.responseText );

					if ( l10nInfo ) {
						saveTranslation( primaryLang, l10nInfo );

						// Skip if it took too long
						if ( wmL10nVisible.ready ) {
							return;
						}
						addHtmlLang( primaryLang );
						replacel10nText( l10nInfo );
					}

				} else {
					wmL10nVisible.makeVisible();
					return;
				}
			}
		};

		l10nReq.send();
	} else {
		l10nInfo = storedTranslations[ primaryLang ];
		// Skip if it took too long
		if ( wmL10nVisible.ready ) {
			return;
		}
		addHtmlLang( primaryLang );
		replacel10nText( l10nInfo );
	}

}( wmTest, translationsHash, mw, rtlLangs ) );
