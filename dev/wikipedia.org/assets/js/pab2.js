/* global wmTest, WMTypeAhead, doWhenReady, _, addEvent */

( function ( wmTest, WMTypeAhead ) {
	doWhenReady( function () {
		/**
		 * Removing all event listeners on search element,
		 * removes old search suggestions
		 */
		var search = document.getElementById( 'searchInput' ),
			searchClone = search.cloneNode( true ),
			inputEvent;

		search.parentNode.replaceChild( searchClone, search );

		searchClone.focus();

		var typeAhead = new WMTypeAhead( 'search-input', 'searchInput' );

		/**
		 * Testing for 'input' event and falling back to 'propertychange' event for IE.
		 */
		if ( 'oninput' in document ) {
			inputEvent = 'input';
		} else {
			inputEvent = 'propertychange';
		}

		/**
		 * Attaching type-ahead query action to 'input' event.
		 */
		addEvent( searchClone, inputEvent, _.debounce( function () {
			typeAhead.query( searchClone.value, document.getElementById( 'searchLanguage' ).value );
		}, 100 ) );
	} );

}( wmTest, WMTypeAhead ) );
