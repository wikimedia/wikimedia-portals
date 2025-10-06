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
 * Validate with ESLint.
 *
 */
/* global doWhenReady */

( function () {
	'use strict';

	doWhenReady( () => {
		var select = document.getElementById( 'searchLanguage' ), langLabel;

		/**
		 * Adjusts input's padding to the size of the language code.
		 *
		 * @param {string} label
		 */
		function adjustInputPadding( label ) {
			var rem = 4;
			if ( label.length > 3 ) {
				rem = 6;
			} else if ( label.length === 3 ) {
				rem = 4.5;
			}
			document.getElementById( 'searchInput' ).style.paddingRight = ( 16 * rem ) + 'px';
		}

		/**
		 * Creates a fancy label that will cover the native select.
		 *
		 * This obviously only affects users who have JS enabled.
		 *
		 * @return {HTMLElement}
		 */
		function createJSLangLabel() {
			var label = document.createElement( 'label' );
			label.setAttribute( 'for', 'searchLanguage' );
			label.setAttribute( 'id', 'jsLangLabel' );
			label.className = 'js-langpicker-label';
			label.innerText = select.value;
			label.textContent = select.value;

			select.parentNode.parentNode.className = ' styled-select js-enabled';
			adjustInputPadding( select.value );
			select.parentNode.insertBefore( label, select );

			return label;
		}

		langLabel = createJSLangLabel();

		/**
		 * Updates the language selector label.
		 *
		 * @param {string} val New language code.
		 */
		function changeLangLabel( val ) {
			langLabel.innerText = val;
			langLabel.textContent = val;
			adjustInputPadding( val );
		}

		select.addEventListener( 'change', () => {
			changeLangLabel( select.value );
		} );
	} );

}() );
