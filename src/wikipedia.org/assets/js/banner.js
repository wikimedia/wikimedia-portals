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
		bannerLinkEl = bannerEl.querySelectorAll( 'a' ),
		bannerVisibleClass = 'banner--visible',
		bannerReplacements = [
			{ selector: '.banner__amount1', US: '$2.75', CA: '$2.75', AU: '$2.75', NZ: '$2.75', GB: '£2', IE: '€2.50' },
			{ selector: '.banner__amount2', US: '$25', CA: '$25', AU: '$25', NZ: '$25', GB: '£25', IE: '€25' },
			{ selector: '.banner__average', US: '$13', CA: '$12', AU: '$11', NZ: '$12', GB: '£6', IE: '€8' },
			{
				selector: '.banner__country',
				US: 'the United States',
				CA: 'Canada',
				AU: 'Australia',
				NZ: 'New Zealand',
				GB: 'the UK',
				IE: 'Ireland'
			},
			{
				selector: '.banner__currency',
				US: '$',
				CA: '$',
				AU: '$',
				NZ: '$',
				GB: '£',
				IE: '€'
			}
		];

	for ( let i = 0; i < bannerReplacements.length; i++ ) {
		var replacedElements = document.querySelectorAll( bannerReplacements[ i ].selector );
		for ( var j = 0; j < replacedElements.length; j++ ) {
			var element = replacedElements[ j ];
			if ( bannerReplacements[ i ][ country ] ) {
				element.innerHTML = bannerReplacements[ i ][ country ];
			}
		}
	}

	if ( typeof bannerCloseEl !== 'undefined' && bannerCloseEl !== null ) {
		bannerCloseEl.addEventListener( 'click', function () {
			// 30 day cookie
			document.cookie = 'hideWikipediaPortalBanner=1; max-age=2592000; path=/; Secure';
			bannerEl.classList.remove( bannerVisibleClass );
		} );
	}

	bannerLinkEl.forEach( link => {
		link.href = 'https://donate.wikimedia.org/?wmf_medium=portal&wmf_campaign=portalBanner';
		link.href += '&wmf_source=' + bannerEl.id;
		link.href += '&uselang=en';
		link.target = '_blank';
	} );

	if ( !hideBanner &&
		country &&
		bannerCountries.indexOf( country ) > -1 &&
		userLangs[ 0 ] === bannerLang &&
		currentDate.getFullYear() === 2024
	) {
		bannerEl.classList.add( bannerVisibleClass );
	}

	var bottomBanner = document.querySelector( '.banner-bottom' );
	if ( bottomBanner.classList.contains( 'banner--visible' ) ) {
		document.body.classList.add( 'bottom-banner' );
	}

	var overlayBanner = document.querySelector( '.banner-overlay' );
	if ( overlayBanner.classList.contains( 'banner--visible' ) ) {
		// Display banner
		document.body.classList.add( 'overlay-banner-open' );

		// Toggle mini banner and main banner
		var bannerToggle = document.getElementsByClassName( 'overlay-banner-toggle' );
		var bannerMini = document.getElementsByClassName( 'overlay-banner-mini' )[ 0 ];
		var bannerVisible = document.getElementsByTagName( 'body' )[ 0 ];
		for ( let i = 0; i < bannerToggle.length; i++ ) {
			bannerToggle[ i ].addEventListener( 'click', function () {
				if ( bannerVisible.classList.contains( 'overlay-banner-open' ) ) {
					bannerVisible.classList.remove( 'overlay-banner-open' );
					bannerMini.classList.add( 'visible' );
				} else {
					bannerVisible.classList.add( 'overlay-banner-open' );
					bannerMini.classList.remove( 'visible' );
				}
			} );
		}

		// Close banner on X out
		var bannerClose = document.getElementsByClassName( 'overlay-banner-close' );
		var bannerMain = document.getElementsByClassName( 'overlay-banner' )[ 0 ];
		for ( let i = 0; i < bannerClose.length; i++ ) {
			bannerClose[ i ].addEventListener( 'click', function () {
				document.cookie = 'hideWikipediaPortalBanner=1; max-age=2592000; path=/; Secure';
				bannerMain.style.display = 'none';
			} );
		}

		// Amounts grid
		var amountVal;
		var amountRadios = document.querySelectorAll( 'input[name="amount"]' );
		if ( country === 'GB' ) {
			amountRadios[ 0 ].value = '2';
		}
		if ( country === 'IE' ) {
			amountRadios[ 0 ].value = '2.50';
		}
		amountRadios.forEach( radioA => {
			radioA.addEventListener( 'click', function () {
				amountVal = radioA.value;
				bannerLinkEl.forEach( link => {
					link.href += '&preSelect=' + amountVal;
				} );
				var children = document.getElementById( 'amountsGrid' ).childNodes;
				for ( let i = 0; i < children.length; i++ ) {
					if ( children[ i ].classList ) {
						children[ i ].classList.remove( 'selected' );
					}
				}
				radioA.parentNode.classList.add( 'selected' );
				if ( document.getElementById( 'amountsGrid' ).querySelector( '.selected' ) && document.getElementById( 'frequencyGrid' ).querySelector( '.selected' ) ) {
					document.getElementById( 'frb-donate' ).classList.remove( 'banner-button-disabled' );
					document.getElementById( 'frb-donate' ).classList.add( 'selected' );
				}
			} );
		} );

		// Frequency grid
		var monthlyVal;
		var monthlyRadios = document.querySelectorAll( 'input[name="monthly"]' );
		monthlyRadios.forEach( radioM => {
			radioM.addEventListener( 'click', function () {
				monthlyVal = radioM.value;
				bannerLinkEl.forEach( link => {
					link.href += '&monthly=' + monthlyVal;
				} );
				var children = document.getElementById( 'frequencyGrid' ).childNodes;
				for ( let i = 0; i < children.length; i++ ) {
					if ( children[ i ].classList ) {
						children[ i ].classList.remove( 'selected' );
					}
				}
				radioM.parentNode.classList.add( 'selected' );
				if ( document.getElementById( 'amountsGrid' ).querySelector( '.selected' ) && document.getElementById( 'frequencyGrid' ).querySelector( '.selected' ) ) {
					document.getElementById( 'frb-donate' ).classList.remove( 'banner-button-disabled' );
					document.getElementById( 'frb-donate' ).classList.add( 'selected' );
				}
			} );
		} );

		// Disable donate button until amount and frequency are selected
		var overlayDonateButton = document.getElementById( 'frb-donate' );
		overlayDonateButton.addEventListener( 'click', function () {
			if ( this.classList.contains( 'banner-button-disabled' ) ) {
				event.preventDefault();
			}
		} );

	}

}( wmTest ) );