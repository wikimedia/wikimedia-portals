/* global wmTest */
/**
 * Run fundraising banners.
 *
 * Selects a random element with CSS class banner-container to display
 * in given countries and languages.
 */
( function ( wmTest ) {
	var
		geoCookieCountry = document.cookie.match( /GeoIP=.[^:]/ ),
		country = geoCookieCountry && geoCookieCountry.toString().split( '=' )[ 1 ],
		bannerCountries = [ 'US', 'CA', 'GB', 'IE', 'AU', 'NZ' ],
		bannerLang = 'en',
		userLangs = wmTest.userLangs,
		currentDate = new Date(),
		hideBanner = /(hideWikipediaPortalBanner|centralnotice_hide_fundraising)/.test( document.cookie ),
		allBannerEls = document.querySelectorAll( '.banner' ),
		bannerEl = allBannerEls[ Math.floor( Math.random() * allBannerEls.length ) ],
		bannerCloseEl = bannerEl.querySelector( '.banner__close' ),
		bannerLinkEl = bannerEl.querySelector( 'a' ),
		bannerVisibleClass = 'banner--visible',
		bannerReplacements = [
			{ selector: '.banner__amount1', US: '$2.75', CA: '$2.75', AU: '$2.75', NZ: '$2.75', GB: '£2', IE: '€2' },
			{ selector: '.banner__amount2', US: '$25', CA: '$25', AU: '$25', NZ: '$25', GB: '£25', IE: '€25' },
			{
				selector: '.banner__country',
				US: 'the United States',
				CA: 'Canada',
				AU: 'Australia',
				NZ: 'New Zealand',
				GB: 'the UK',
				IE: 'Ireland'
			}
		];

	for ( var i = 0; i < bannerReplacements.length; i++ ) {
		var replacedElements = document.querySelectorAll( bannerReplacements[ i ].selector );
		for ( var j = 0; j < replacedElements.length; j++ ) {
			var element = replacedElements[ j ];
			if ( bannerReplacements[ i ][ country ] ) {
				element.innerHTML = bannerReplacements[ i ][ country ];
			}
		}
	}

	bannerCloseEl.addEventListener( 'click', function () {
		// 30 day cookie
		document.cookie = 'hideWikipediaPortalBanner=1; max-age=2592000; path=/; Secure';
		bannerEl.classList.remove( bannerVisibleClass );
	} );
	bannerLinkEl.href = 'https://donate.wikimedia.org/?utm_medium=portal&utm_campaign=portalBanner';
	bannerLinkEl.href += '&uselang=en';

	if ( Math.random() > 0.5 ) {
		bannerEl.classList.add( 'banner--txt1' );
		bannerLinkEl.href += '&utm_source=' + bannerEl.id + '_txt1';
	} else {
		bannerEl.classList.add( 'banner--txt2' );
		bannerLinkEl.href += '&utm_source=' + bannerEl.id + '_txt2';
	}

	bannerLinkEl.target = '_blank';
	if ( !hideBanner &&
		country &&
		bannerCountries.indexOf( country ) > -1 &&
		userLangs[ 0 ] === bannerLang &&
		currentDate.getFullYear() === 2023
	) {
		bannerEl.classList.add( bannerVisibleClass );
	}
	var bottomBanner = document.querySelector( '.banner-bottom' );
	if ( bottomBanner.classList.contains( 'banner--visible' ) ) {
		document.body.classList.add( 'bottom-banner' );
	}
}( wmTest ) );
