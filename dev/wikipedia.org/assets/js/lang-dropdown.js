/* eslint-disable linebreak-style */
/* global addEvent, wmTest */
/*
 * The following functions open and close the language list
 * via the language drop-down button.
 *
 * - If the user has JS disabled, the language list is open by default.
 * - If the users browser is set to a language that is not present on the page,
 *   the list also opens.
 * - When the user opens the list and refreshes the page, the list remains open
 *   (provided their browser supports localStorage).
 *
 */

( function () {

	var langButton = document.getElementById( 'js-lang-list-button' );

	function toggleActiveClass() {
		if ( / lang-list-active /g.test( document.body.className ) ) {
			document.body.className = document.body.className.replace( ' lang-list-active ', '' );
			mw.storage.set( 'lang-list-active', 'false' );
		} else {
			document.body.className += ' lang-list-active ';
			mw.storage.set( 'lang-list-active', 'true' );
		}
	}

	function userLangWikiMissing( langs ) {
		var anchors = document.getElementsByTagName( 'a' ),
			langMissing = true, // Being pessimistic
			i, anchor, langAttr;

		for ( i = 0; i < anchors.length && langMissing; i++ ) {
			anchor = anchors[ i ];
			langAttr = anchor.getAttribute( 'lang' );

			if ( langAttr && langs.indexOf( langAttr ) >= 0 ) {
				langMissing = false; // Lang exists
			}
		}

		return langMissing;
	}

	if ( mw.storage.get( 'lang-list-active' ) === 'true' || userLangWikiMissing( wmTest.userLangs ) ) {
		toggleActiveClass();
	}

	addEvent( langButton, 'click', function () {
		toggleActiveClass();
	} );

}() );
