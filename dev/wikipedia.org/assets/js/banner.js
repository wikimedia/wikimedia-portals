/* global wmTest, addEvent */
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
		bannerCountries = [ 'US', 'CA', 'AU', 'NZ', 'GB', 'IE' ],
		bannerLang = 'en',
		userLangs = wmTest.userLangs,
		currentDate = new Date(),
		hideBanner = /(hideWikipediaPortalBanner|centralnotice_hide_fundraising)/.test( document.cookie ),
		allBannerEls = document.querySelectorAll( '.banner' ),
		bannerEl = allBannerEls[ Math.floor( Math.random() * allBannerEls.length ) ],
		bannerCloseEl = bannerEl.querySelector( '.banner__close' ),
		bannerLinkEl = bannerEl.querySelector( 'a' ),
		bannerVisibleClass = 'banner--visible',
		bannerAmountEl = bannerEl.querySelector( '.banner__amount' ),
		bannerAmounts = {
			US: '$2.75',
			CA: '$2.75',
			AU: '$2.75',
			NZ: '$2.75',
			GB: '£2',
			IE: '€2'
		};

	addEvent( bannerCloseEl, 'click', function () {
		document.cookie = 'hideWikipediaPortalBanner';
		bannerEl.classList.remove( bannerVisibleClass );
	} );

	bannerLinkEl.href = 'https://donate.wikimedia.org/?utm_medium=portal&utm_campaign=portalBanner';
	bannerLinkEl.href += '&uselang=en';
	if ( Math.random() >= 0.5 ) {
		bannerLinkEl.href += '&utm_source=portalBanner_en6C_2020a_dwk_logoWikipedia&addStyle=add_logoWikipedia1';
	} else {
		bannerLinkEl.href += '&utm_source=portalBanner_en6C_2020a_dwk_control&addStyle=add_logoWMF';
	}
	bannerLinkEl.target = '_blank';

	if ( bannerAmounts[ country ] ) {
		bannerAmountEl.innerHTML = bannerAmounts[ country ];
	}

	if ( !hideBanner &&
		country &&
		bannerCountries.indexOf( country ) > -1 &&
		userLangs[ 0 ] === bannerLang &&
		currentDate.getFullYear() === 2020
	) {
		bannerEl.classList.add( bannerVisibleClass );
	}

}( wmTest ) );
