/*global
 wmStats, wmTest
 */

function localizeTopTen( ) {

	/**
	* Creates an array of existing language codes in the top ten links.
	*
	* returns {Array} topLinkLangs.
	*/
	function setTopLinkLangs( topLinks ) {
		var topLinkLangs = [ ];

		for ( var i = 0; i < topLinks.length; i++ ) {
			var topLinkLang = topLinks[ i ].getAttribute( 'lang' );
			topLinkLangs.push( topLinkLang );
		}

		return topLinkLangs;
	}

	/**
	 * List of preferred languages
	 *
	 * @type {Array}
	 */
	var preferredLanguages = wmTest.userLangs,
		i, topLinks = document.querySelectorAll( '.central-featured-lang' ),
		topLinksContainer = document.querySelector( '.central-featured' ),
		textLogo = document.querySelector( '.central-textlogo' ),
		topLinkLangs = setTopLinkLangs( topLinks );

	/**
	* Merges the preferred language codes {@link #preferredLanguages} with the
	* existing top ten languages {@link #topLinkLangs}.
	* - If a preferred language exists in the top ten, it is moved to the top of the array.
	* - If a preferred language doesn't exist, it is added to the array and the last language
	* is removed.
	*
	* Manipulates the {@link #topLinkLangs} array.
	*/
	function mergeNewTopLinkLangs() {
		for ( i = 0; i < preferredLanguages.length; i++ ) {
			var pl = preferredLanguages[ i ],
				plIndex = topLinkLangs.indexOf( pl ),
				plExists = plIndex >= 0,
				plRightSpot = plIndex === i;

			if ( plExists ) {
				if ( !plRightSpot ) {
					topLinkLangs.splice( i, 0, topLinkLangs.splice( plIndex, 1 )[ 0 ] );
				}
			} else {
				topLinkLangs.splice( i, 0, pl );
				topLinkLangs.pop();
			}
		}
	}

	/**
	* Changes the text and attributes of a top link node to a different language.
	* This allows us to place a new language into the top ten by reusing an existing
	* DOM node instead of creating a new one.
	*/
	function localizeTopLink( node, lang ) {
		var wiki = wmStats[ lang ];

		if ( wiki ) {
			var anchor = node.getElementsByTagName( 'a' )[ 0 ],
			// some wiki titles are placed within a <bdi dir="rtl"> tag.
			// strip the tag for the title attribute.
			wikiNameStripped = wiki.name.replace( /<\/?[^>]+(>|$)/g, '' );

			anchor.setAttribute( 'href', '//' + wiki.url );
			anchor.setAttribute( 'title', wikiNameStripped + ' — ' + wiki.siteName + ' — ' + ( wiki.slogan || '' ) );
			node.setAttribute( 'lang', lang );
			node.getElementsByTagName( 'strong' )[ 0 ].textContent = wikiNameStripped;
			node.getElementsByTagName( 'em' )[ 0 ].textContent = ( wiki.slogan || '' );
			node.getElementsByTagName( 'small' )[ 0 ].textContent = wiki.numPages + '+ ' + ( wiki.articles || '' );
		}
	}

	/**
	* Reorganizes the DOM order of top links based on the {@link #topLinkLangs} array.
	* If a preferred language in `topLinkLangs` does not exist in
	* the top ten, then the last node in the top ten is manipulated
	* to contain the new language.
	*/
	function organizeTopLinks() {
		for ( i = 0; i < topLinkLangs.length; i++ ) {

			var topLinks = document.querySelectorAll( '.central-featured-lang' ),
				topLinkLang = topLinkLangs[ i ],
				topLinkNode = document.querySelector( '.central-featured-lang[lang=' + topLinkLang + ']' );

			if ( topLinkNode ) {
				var topLinkNodeIndex = Array.prototype.indexOf.call( topLinks, topLinkNode );
				if ( topLinkNodeIndex !== i ) {
					topLinksContainer.insertBefore( topLinkNode, topLinks[ i ] );
				}
			} else {
				var repurposedTopLink = topLinks[ topLinks.length - 1 ];
				localizeTopLink( repurposedTopLink, topLinkLang );
				topLinksContainer.insertBefore( repurposedTopLink, topLinks[ i ] );
			}
		}
	}

	/**
	* Renames the top link classes to appear correctly around the globe image.
	* this should happen after the top links nodes have been reorganized.
	*/
	function reorganizeTopLinkClasss() {
		topLinks = document.querySelectorAll( '.central-featured-lang' );
		for ( i = 0; i < topLinks.length; i++ ) {
			var topLink = topLinks[ i ],
				topLinkClass = topLink.className,
				correctClassName = 'central-featured-lang lang' + ( i + 1 );

			if ( topLinkClass !== correctClassName ) {
				topLink.className = correctClassName;
			}
		}
	}

	/**
	* Creates a localized slogan ('The Free Encyclopedia') below the Wikipedia wordmark
	*/
	function createLocalizedSlogan() {
		var localizedSlogan = document.createElement( 'strong' ),
			sloganText = wmStats[ preferredLanguages[ 0 ] ].slogan || 'The free encyclopedia';

		localizedSlogan.textContent = sloganText;
		localizedSlogan.className = 'localized-slogan';
		textLogo.appendChild( localizedSlogan );
	}

	mergeNewTopLinkLangs();
	organizeTopLinks();
	createLocalizedSlogan();
	reorganizeTopLinkClasss();

	/**
	* Sets the top ten style to visible after reoganizing top links.
	*/
	topLinksContainer.style.visibility = 'visible';

}

if ( wmTest.group === 'language-detection-b' ) {
	localizeTopTen();
}
