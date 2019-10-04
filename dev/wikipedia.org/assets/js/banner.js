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
		bannerCountries = [ 'FR' ],
		bannerLang = 'fr',
		userLangs = wmTest.userLangs,
		hideBanner = /(hideWikipediaPortalBanner|centralnotice_hide_fundraising)/.test( document.cookie ),
		allBannerEls = document.querySelectorAll( '.banner-container' ),
		bannerEl = allBannerEls[ Math.floor( Math.random() * allBannerEls.length ) ],
		bannerCloseEl = bannerEl.querySelector( '.banner__close' ),
		bannerLinkEl = bannerEl.querySelector( 'a' ),
		bannerVisibleClass = 'banner-visible';

	addEvent( bannerCloseEl, 'click', function () {
		document.cookie = 'hideWikipediaPortalBanner';
		bannerEl.classList.remove( bannerVisibleClass );
	} );

	bannerLinkEl.href = 'https://donate.wikimedia.org/?utm_medium=portal&utm_campaign=portalBanner';
	bannerLinkEl.href += '&uselang=fr&country=FR';
	bannerLinkEl.href += '&utm_source=' + bannerEl.id;
	bannerLinkEl.target = '_blank';

	if ( !hideBanner &&
		country &&
		bannerCountries.indexOf( country ) > -1 &&
		userLangs[ 0 ] === bannerLang
	) {
		bannerEl.classList.add( bannerVisibleClass );
	}

}( wmTest ) );
