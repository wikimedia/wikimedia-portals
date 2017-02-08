/* global wmTest, translationsHash, mw */

/**
 * This script localizes the page text.
 * Text includes the footer text, language button text, sister project name & slogan.
 *
 * Each localized text node is given a class name that corresponds to a property
 * in the translation json object.
 *
 * eg: the class `jsl10n_wiktionary_name` will be translated to en.wikitionary.name value.
 * If a translation value is missing, page will default to english.
 */

( function ( wmTest, translationsHash, mw ) {

	var primaryLang = wmTest.userLangs[ 0 ],
		storedTranslationHash,
		storedTranslations,
		rtlLangs = [
			'ar',
			'arc',
			'arz',
			'bcc',
			'bgn',
			'bqi',
			'ckb',
			'dv',
			'fa',
			'glk',
			'he',
			'kk-cn',
			'kk-arab',
			'khw',
			'ks',
			'ku-arab',
			'lki',
			'lrc',
			'luz',
			'mzn',
			'pnb',
			'ps',
			'sd',
			'sdh',
			'ug',
			'ur',
			'yi'
		];

	/**
	 * Helper function to safely parse JSON an return empty string on error.
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

	function makePageVisible() {
		document.body.className = document.body.className + ' jsl10n-visible';
	}

	if ( wmTest.userLangs[ 0 ] === 'en' ) {
		makePageVisible();
		return;
	}

	storedTranslationHash = isValidHash();
	storedTranslations = ( storedTranslationHash ) ? safelyParseJSON( mw.storage.get( 'storedTranslations' ) ) || {} : {};

	/**
	 * Saves translation to localstorage
	 * @param {String} lang language code that acts as the key to the translation.
	 * @param {Object} translation translation data.
	 *
	 * @return {undefined}
	 */
	function saveTranslation( lang, translation ) {
		var storedTranslations = safelyParseJSON( mw.storage.get( 'storedTranslations' ) ) || {};

		storedTranslations[ lang ] = translation;
		mw.storage.set( 'storedTranslations', JSON.stringify( storedTranslations ) );
	}

	/**
	 * Takes an object and a string 'foo.bar' and returns object.foo.bar if exists.
	 * @param {Object} obj The object to traverse.
	 * @param {String} path A string representing the dot notation of the object.
	 *
	 * @return {Object}
	 */
	function getPropFromPath( obj, path ) {

		path = path.split( '.' );

		var index = 0,
			length = path.length;

		while ( obj && index < length ) {
			obj = obj[ path[ index++ ] ];
		}
		return ( index && index === length ) ? obj : undefined;

	}

	/**
	 * Takes the translation data object and replaces corresponding DOM element textContent with translation values.
	 *
	 * @param {Object} l10nInfo Object containing translation data.
	 */
	function replacel10nText( l10nInfo ) {
		var domEls = document.querySelectorAll( '.jsl10n' );

		for ( var i = 0; i < domEls.length; i++ ) {

			var domEl = domEls[ i ],
				textValue = getPropFromPath( l10nInfo, domEl.getAttribute( 'data-jsl10n' ) );

			if ( typeof textValue === 'string' && textValue.length > 0 ) {
				domEl.textContent = textValue;
			}
		}
		makePageVisible();
	}

	function addHtmlLang( lang ) {
		document.lang = lang;
		if ( rtlLangs.indexOf( lang ) >= 0 ) {
			document.dir = 'rtl';
		} else {
			document.dir = 'ltr';
		}
	}
	/**
	 * if the primary language is not english, and the translation is missing or outdated,
	 * fetch the latest one.
	 */
	if ( !storedTranslations[ primaryLang ] ) {

		var l10nReq = new XMLHttpRequest();

		l10nReq.open( 'GET', encodeURI( 'portal/wikipedia.org/assets/l10n/' + primaryLang + '-' + translationsHash + '.json' ), true );

		l10nReq.onreadystatechange = function () {
			if ( l10nReq.readyState === 4 ) {
				if ( l10nReq.status === 200 ) {

					var l10nInfo = safelyParseJSON( this.responseText );

					if ( l10nInfo ) {
						addHtmlLang( primaryLang );
						saveTranslation( primaryLang, l10nInfo );
						replacel10nText( l10nInfo );
					}

				} else {
					makePageVisible();
					return;
				}
			}
		};

		l10nReq.send();
	} else {
		var l10nInfo = storedTranslations[ primaryLang ];
		replacel10nText( l10nInfo );
	}

}( wmTest, translationsHash, mw ) );
