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
		bannerCountries = [ 'SE' ],
		bannerLang = 'sv',
		userLangs = wmTest.userLangs,
		hideBanner = /(hideWikipediaPortalBanner|centralnotice_hide_fundraising)/.test( document.cookie ),
		allBannerEls = document.querySelectorAll( '.banner' ),
		bannerEl = allBannerEls[ Math.floor( Math.random() * allBannerEls.length ) ],
		bannerCloseEl = bannerEl.querySelector( '.banner__close' ),
		bannerLinkEl = bannerEl.querySelector( 'a' ),
		bannerVisibleClass = 'banner--visible',
		bannerAmountEl = bannerEl.querySelector( '.banner__amount' ),
		bannerAmounts = {
			SE: '30 kr'
		};

	bannerCloseEl.addEventListener( 'click', function () {
		// 30 day cookie
		document.cookie = 'hideWikipediaPortalBanner=1; max-age=2592000; path=/; Secure';
		bannerEl.classList.remove( bannerVisibleClass );
	} );

	bannerLinkEl.href = 'https://donate.wikimedia.org/?utm_medium=portal&utm_campaign=portalBanner';
	bannerLinkEl.href += '&uselang=sv';
	bannerLinkEl.href += '&utm_source=' + bannerEl.id;
	bannerLinkEl.target = '_blank';

	if ( bannerAmounts[ country ] ) {
		bannerAmountEl.innerHTML = bannerAmounts[ country ];
	}

	if ( !hideBanner &&
		country &&
		bannerCountries.indexOf( country ) > -1 &&
		userLangs[ 0 ] === bannerLang
	) {
		bannerEl.classList.add( bannerVisibleClass );
	}
}( wmTest ) );
