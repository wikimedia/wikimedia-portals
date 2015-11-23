/* global wmTest, WMTypeAhead, lp, doWhenReady, _, addEvent */

( function ( wmTest, WMTypeAhead, lp ) {
	doWhenReady( function () {
		if ( wmTest.abtest2 ) {
			/**
			 * Removing all event listeners on search element,
			 * removes old search suggestions
			 */
			var search = document.getElementById( 'searchInput' ),
				searchClone = search.cloneNode( true ),
				inputEvent;

			search.parentNode.replaceChild( searchClone, search );

			/**
			 * Updating language selector with new input.
			 * @type {Node|*}
			 */
			lp.searchInput = searchClone;

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
				typeAhead.query( searchClone.value, lp.getLanguage() );
			}, 100 ) );
		}
	} );

}( wmTest, WMTypeAhead, lp ) );
