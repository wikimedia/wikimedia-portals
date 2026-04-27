/* global wmTest */
/**
 * Run fundraising banners.
 *
 * Selects a random element with CSS class banner-container to display
 * in given countries and languages.
 *
 * @param wmTest
 */
( function ( wmTest ) {
	const
		geoCookieCountry = document.cookie.match( /GeoIP=.[^:]/ ),
		country = geoCookieCountry && geoCookieCountry.toString().split( '=' )[ 1 ],
		bannerCountries = [ 'US', 'CA', 'GB', 'IE', 'AU', 'NZ', 'BR', 'NL', 'FR', 'IT' ],
		bannerLang = 'en',
		userLangs = wmTest.userLangs,
		currentDate = new Date(),
		hideBanner = /(hideWikipediaPortalBanner|centralnotice_hide_fundraising)/.test( document.cookie ),
		bannerEl = document.querySelector( '.banner' ),
		bannerCloseEl = bannerEl.querySelector( '.banner__close' ),
		iadEl = bannerEl.querySelector( '.frb-iad' ), // I already donated
		bannerLinkEl = bannerEl.querySelectorAll( 'a.frb-submit' ),
		bannerVisibleClass = 'banner--visible',
		bannerReplacements = [
			{ selector: '.banner__amount1', US: '$2.75', CA: '$2.75', AU: '$2.75', NZ: '$2.75', GB: '£2', IE: '€2.50', BR: 'R$15', NL: '€2.50', FR: '€2.50', IT: '€2.50' },
			{ selector: '.banner__amount2', US: '$20', CA: '$20', AU: '$20', NZ: '$20', GB: '£20', IE: '€20', BR: 'R$70', NL: '€20', FR: '€20', IT: '€20' },
			{ selector: '.banner__average', US: '$13', CA: '$12', AU: '$11', NZ: '$12', GB: '£6', IE: '€8', BR: 'R$25', NL: '€8', FR: '€8', IT: '€8' }
		];
	for ( let i = 0; i < bannerReplacements.length; i++ ) {
		const replacedElements = document.querySelectorAll( bannerReplacements[ i ].selector );
		for ( let j = 0; j < replacedElements.length; j++ ) {
			const element = replacedElements[ j ];
			if ( bannerReplacements[ i ][ country ] ) {
				element.innerHTML = bannerReplacements[ i ][ country ];
			}
		}
	}
	if ( typeof bannerCloseEl !== 'undefined' && bannerCloseEl !== null ) {
		bannerCloseEl.addEventListener( 'click', () => {
			// 14 day cookie
			document.cookie = 'hideWikipediaPortalBanner=1; max-age=1209600; path=/; Secure';
			bannerEl.classList.remove( bannerVisibleClass );
		} );
	}
	if ( typeof iadEl !== 'undefined' && iadEl !== null ) {
		iadEl.addEventListener( 'click', () => {
			// 31 day cookie
			document.cookie = 'centralnotice_hide_fundraising=1; max-age=2678400; path=/; Secure';
			bannerEl.classList.remove( bannerVisibleClass );
			document.querySelector( '.frb-iad-dialog' ).showModal();
		} );
		const iadCloseEl = document.querySelectorAll( '.frb-iad-dialog-close' );
		iadCloseEl.forEach( ( closeButton ) => {
			closeButton.addEventListener( 'click', () => {
				document.querySelector( '.frb-iad-dialog' ).close();
			} );
		} );

	}

	bannerLinkEl.forEach( ( link ) => {
		link.href = 'https://donate.wikimedia.org/?wmf_medium=portal&wmf_campaign=portalBanner';
		link.href += '&wmf_source=' + bannerEl.id;
		link.href += '&uselang=en';
		link.href += '&appeal=SupportingWikipedia';
		link.target = '_blank';
	} );
	if ( !hideBanner &&
		country &&
		bannerCountries.includes( country ) &&
		userLangs[ 0 ] === bannerLang &&
		currentDate.getFullYear() === 2026 &&
		currentDate.getMonth() <= 4 // May is 4
	) {
		bannerEl.classList.add( bannerVisibleClass );
	}

	const bottomBanner = document.querySelector( '.banner-bottom' );
	if ( bottomBanner.classList.contains( 'banner--visible' ) ) {
		document.body.classList.add( 'bottom-banner' );
	}

}( wmTest ) );
