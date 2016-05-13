/* global addEvent, wmTest */

( function () {

	if ( wmTest.group ===  wmTest.testGroups.test ) {

		var langButton = document.getElementById( 'js-lang-list-button' ),
			langLists = document.getElementById( 'js-lang-lists' ),
			langListOverlay = document.createElement( 'div' ),
			downArrow = document.getElementById( 'js-down-arrow' );

		langListOverlay.className = 'lang-list-overlay';

		addEvent( langButton, 'click', function () {
			if ( langLists.style.display === '' || langLists.style.display === 'none' ) {
				langLists.style.display = 'block';
				downArrow.style.display = 'block';

			} else {
				langLists.style.display = 'none';
				downArrow.style.display = 'none';
			}
		} );

		addEvent( langListOverlay, 'click', function () {
			var langLists = document.getElementById( 'js-lang-lists' );
			langLists.style.display = 'none';
			downArrow.style.display = 'none';
		} );

		langLists.insertBefore( langListOverlay, null );

	}

} )();
