/* global getIso639 */

window.wmTest = ( function () {

	var preferredLangs;

	/**
	 * Created an array of preferred languages in ISO939 format.
	 *
	 * @return {Array} langs
	 */
	function setPreferredLanguages() {
		var langs = [], possibleLanguage, i;

		function appendLanguage( l ) {
			var lang = getIso639( l );
			if ( lang && langs.indexOf( lang ) < 0 ) {
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

	preferredLangs = setPreferredLanguages();

	return {
		/**
		 * The users preferred languages as inferred from
		 * their browser settings.
		 */
		userLangs: preferredLangs

	};

}() );
