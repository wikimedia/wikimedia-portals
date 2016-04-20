/* global wmTest, WMTypeAhead, _, addEvent */

( function ( wmTest, WMTypeAhead ) {

	var inputEvent,
		searchInput = document.getElementById( 'searchInput' ),
		typeAhead = new WMTypeAhead( 'search-input', 'searchInput' );

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
	addEvent( searchInput, inputEvent, _.debounce( function () {
		typeAhead.query( searchInput.value, document.getElementById( 'searchLanguage' ).value );
	}, 100 ) );

}( wmTest, WMTypeAhead ) );
