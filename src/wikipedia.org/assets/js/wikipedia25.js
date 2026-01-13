/**
 * Wikipedia 25 Birthday Mode Toggle.
 *
 * Control the "Birthday Mode" feature. Default to enabled, persist the
 * disabled state via a session cookie, and toggle the CSS class on the document
 * to apply the celebration theme.
 */
( function () {
	var
		toggle = document.querySelector( '#wikipedia25-birthday-mode-toggle-switch' ),
		cookieName = 'wikipedia25-birthday-mode-disabled',
		bodyClass = 'wikipedia25-birthday-mode-enabled',
		isDisabled = document.cookie.indexOf( cookieName + '=1' ) !== -1;

	if ( !toggle ) {
		return;
	}

	function setMode( enabled ) {
		if ( enabled ) {
			document.documentElement.classList.add( bodyClass );
			toggle.checked = true;
			// Remove cookie to revert to default (Enabled)
			document.cookie = cookieName + '=; Max-Age=0; path=/; domain=' + location.host + ';';
		} else {
			document.documentElement.classList.remove( bodyClass );
			toggle.checked = false;
			// Set session cookie to keep it Disabled
			document.cookie = cookieName + '=1; path=/; domain=' + location.host + ';';
		}
	}

	// Initialize state
	// Default is Enabled (so if NO cookie is present, it is Enabled)
	if ( !isDisabled ) {
		document.documentElement.classList.add( bodyClass );
		toggle.checked = true;
	} else {
		document.documentElement.classList.remove( bodyClass );
		toggle.checked = false;
	}

	toggle.addEventListener( 'change', function () {
		setMode( this.checked );
	} );

}() );

/**
 * Wikipedia 25 Modal Dialog.
 *
 * Manage interaction logic for the info dialog. Handle visibility, manage
 * accessibility focus, and listen for mouse, keyboard, and navigation events.
 */
( function () {
	var
		video = document.querySelector( '#wikipedia25-video' ),
		backdrop = document.querySelector( '#wikipedia25-dialog-backdrop' ),
		closeButton = document.querySelector( '#wikipedia25-dialog-close-button' ),
		primaryButton = document.querySelector( '#wikipedia25-dialog-primary-button' ),
		ctaButton = document.querySelector( '#wikipedia25-cta-button' ),
		focusTrapStart = document.querySelector( '.wikipedia25-dialog-focus-trap-start' ),
		focusTrapEnd = document.querySelector( '.wikipedia25-dialog-focus-trap-end' );

	if ( !video || !backdrop ) {
		return;
	}

	// Helper to hide the dialog
	function closeDialog() {
		backdrop.classList.add( 'hidden' );
	}

	// Helper to open the dialog
	function openDialog() {
		backdrop.classList.remove( 'hidden' );
		// Focus the first focusable element or the dialog itself for accessibility
		var dialog = backdrop.querySelector( '#wikipedia25-dialog' );
		if ( dialog ) {
			dialog.focus();
		}
	}

	function handleCTAClick() {
		window.open( 'https://wikimediafoundation.org/wikipedia25/wikipedia-mascot/?utm_campaign=eepp&utm_source=eepp&utm_medium=eepp', '_blank' );
	}

	// Open on video click
	video.addEventListener( 'click', function ( e ) {
		e.preventDefault();
		openDialog();
	} );

	// Close on close button click
	if ( closeButton ) {
		closeButton.addEventListener( 'click', closeDialog );
	}

	// Navigate on primary action button click
	if ( primaryButton ) {
		primaryButton.addEventListener( 'click', handleCTAClick );
	}

	// Navigate on CTA button click
	if ( ctaButton ) {
		ctaButton.addEventListener( 'click', handleCTAClick );
	}

	// Close on click outside (backdrop click)
	backdrop.addEventListener( 'click', function ( e ) {
		if ( e.target === backdrop ) {
			closeDialog();
		}
	} );

	// Close on Escape key
	document.addEventListener( 'keydown', function ( e ) {
		if ( e.key === 'Escape' && !backdrop.classList.contains( 'hidden' ) ) {
			closeDialog();
		}
	} );

	// Focus trap start logic
	if ( focusTrapStart ) {
		focusTrapStart.addEventListener( 'focus', function () {
			if ( primaryButton ) {
				primaryButton.focus();
			} else if ( closeButton ) {
				closeButton.focus();
			}
		} );
	}

	// Focus trap end logic
	if ( focusTrapEnd ) {
		focusTrapEnd.addEventListener( 'focus', function () {
			if ( closeButton ) {
				closeButton.focus();
			} else if ( primaryButton ) {
				primaryButton.focus();
			}
		} );
	}

}() );

/**
 * Wikipedia 25 Video Asset Loader.
 *
 * Inject the correct video source elements. Select the video variant (sneakpeek
 * vs balloons) and serve the appropriate file based on the user's color scheme
 * preference and device pixel density.
 */
( function () {
	var video = document.getElementById( 'wikipedia25-video' );

	if ( !video ) {
		return;
	}

	var dataset = video.dataset;
	var selectedSet;

	if ( document.documentElement.classList.contains( 'wikipedia25-variant-sneakpeek' ) ) {
		selectedSet = 'sneakpeek';
	} else if ( document.documentElement.classList.contains( 'wikipedia25-variant-balloons' ) ) {
		selectedSet = 'balloons';
	} else {
		// Fallback if inline script didn't run or something else happened
		selectedSet = Math.random() < 0.5 ? 'sneakpeek' : 'balloons';
	}

	// Define sources based on selection
	var sources = [
		{
			src: dataset[ selectedSet + 'Dark-300' ],
			media: '(prefers-color-scheme: dark) and (min-resolution: 2dppx)'
		},
		{
			src: dataset[ selectedSet + 'Dark-200' ],
			media: '(prefers-color-scheme: dark)'
		},
		{
			src: dataset[ selectedSet + 'Light-300' ],
			media: '(prefers-color-scheme: light) and (min-resolution: 2dppx)'
		},
		{
			src: dataset[ selectedSet + 'Light-200' ],
			media: '(prefers-color-scheme: light)'
		},
		{
			src: dataset[ selectedSet + 'Light-200' ] // Fallback
		}
	];

	// Create and append source elements
	sources.forEach( function ( s ) {
		if ( s.src ) {
			var source = document.createElement( 'source' );
			source.src = s.src;
			source.type = 'video/mp4';
			if ( s.media ) {
				source.media = s.media;
			}
			video.appendChild( source );
		}
	} );

	function onVideoLoaded() {
		document.documentElement.classList.add( 'wikipedia25-video-loaded' );
		video.removeEventListener( 'canplay', onVideoLoaded );
	}

	video.addEventListener( 'canplay', onVideoLoaded );

	// Force reload since we changed sources programmatically
	video.load();

}() );
