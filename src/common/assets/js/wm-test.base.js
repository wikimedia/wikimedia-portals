/* global getIso639 */

window.wmTest = window.wmTest || {};
( function () {

	/**
	 * Created an array of preferred languages in ISO939 format.
	 *
	 * @return {Array} langs
	 */
	function setPreferredLanguages() {
		var langs = [], possibleLanguage, i;

		function appendLanguage( l ) {
			var lang = getIso639( l );
			if ( lang && !langs.includes( lang ) ) {
				langs.push( lang );
			}
		}

		for ( i in navigator.languages ) {
			appendLanguage( navigator.languages[ i ] );
		}

		// Gets browser languages from some old Android devices
		if ( /Android/i.test( navigator.userAgent ) ) {
			possibleLanguage = navigator.userAgent.split( ';' );
			if ( possibleLanguage[ 3 ] ) {
				appendLanguage( possibleLanguage[ 3 ].trim() );
			}
		}

		appendLanguage( navigator.language );
		appendLanguage( navigator.userLanguage );
		appendLanguage( navigator.browserLanguage );
		appendLanguage( navigator.systemLanguage );

		return langs;
	}

	/**
	 * Returns the preferred locale in BCP 47 format in lowercase (like 'zh-cn').
	 * This is used to handle some language with variants like Chinese.
	 *
	 * @return {string}
	 */
	function getFullLocale() {
		var uiLang = ( navigator.languages && navigator.languages[ 0 ] ) ||
			navigator.language || navigator.userLanguage || '';
		return uiLang.toLowerCase();
	}

	/**
	 * Determine whether the specified locale is Simplified Chinese or not.
	 *
	 * @param {string} locale
	 * @return {boolean} true if locale is a Simp Chinese script, false for Trad Chinese
	 * @throws {TypeError} if locale is not a zh locale
	 */
	function isSimpChinese( locale ) {
		var hans = [ 'zh', 'zh-hans', 'zh-cn', 'zh-sg', 'zh-my', 'zh-hans-cn', 'zh-hans-sg', 'zh-hans-my' ],
			hant = [ 'zh-hk', 'zh-tw', 'zh-mo', 'zh-hant-hk', 'zh-hant-tw', 'zh-hant-mo' ];

		if ( hans.includes( locale ) ) {
			return true;
		} else if ( hant.indexOf( locale !== -1 ) ) {
			return false;
		} else {
			throw new TypeError( locale + ' is not a Chinese locale!' );
		}
	}

	var preferredLangs = setPreferredLanguages(),
		primaryLang = preferredLangs[ 0 ];

	if ( primaryLang === 'zh' ) {
		if ( isSimpChinese( getFullLocale() ) ) {
			primaryLang = 'zh-hans';
		} else {
			primaryLang = 'zh-hant';
		}
	}

	Object.assign( window.wmTest, {
		/**
		 * The users preferred languages as inferred from
		 * their browser settings.
		 */
		userLangs: preferredLangs,

		primaryLang: primaryLang
	} );

}() );
