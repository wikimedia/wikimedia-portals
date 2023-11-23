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
		bannerAmountEl = bannerEl.querySelector( '.banner__amount' ),
		bannerAmounts = {
			US: '$3',
			CA: '$3',
			AU: '$3',
			NZ: '$3',
			GB: '£2',
			IE: '€2'
		};
	bannerCloseEl.addEventListener( 'click', function () {
		// 30 day cookie
		document.cookie = 'hideWikipediaPortalBanner=1; max-age=2592000; path=/; Secure';
		bannerEl.classList.remove( bannerVisibleClass );
	} );
	bannerLinkEl.href = 'https://donate.wikimedia.org/?utm_medium=portal&utm_campaign=portalBanner';
	bannerLinkEl.href += '&uselang=en';

	bannerLinkEl.href += '&utm_source=' + bannerEl.id;
	if ( Math.random() > 0.5 ) {
		bannerEl.classList.add( 'banner--fonts1' );
		bannerLinkEl.href += '_fonts1';
	} else {
		bannerEl.classList.add( 'banner--fonts2' );
		bannerLinkEl.href += '_fonts2';
	}

	// Fundraise Up test
	if ( country === 'US' ) {
		if ( Math.random() > 0.5 ) {
			bannerLinkEl.href += 'FRU&fundraiseupScript=1&form-template=FRU_US_4';
		} else {
			bannerLinkEl.href += 'WikiForm&country=US&form-countryspecific=Form-countryspecific-firstAmt3&monthlyconvert=false';
		}
	}

	bannerLinkEl.target = '_blank';
	if ( bannerAmounts[ country ] ) {
		bannerAmountEl.innerHTML = bannerAmounts[ country ];
	}
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
