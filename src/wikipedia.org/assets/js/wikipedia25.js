/**
 * Audio files to play when the user clicks on the video logo.
 */
const audioFiles = [
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_lmo.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_pms.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_cs.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_piano_code.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_hr_1.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_it.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_mad.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_sl.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_bew.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_id.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_id_2.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_ja.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_sas.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_en_abal1412.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_ru_abal1412.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_vi_central.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_vi_north.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_vi_south.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_vi_north_caryll.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_sonic_logo_4s.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_hr_staff.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_el_casual.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_ru_staff.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_uz.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_he.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_nl.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_de.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_ca_masc.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_es_fem.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_es.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_fr.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_nl_2.webm',
	'portal/wikipedia.org/assets/img/wikipedia25_welcome_zh.webm'
];

/**
 * Play random audio file.
 */
function playRandomAudio() {
	const randomAudio = audioFiles[ Math.floor( Math.random() * audioFiles.length ) ];
	const audio = new Audio( randomAudio );
	audio.play().catch( () => {} );
}

/**
 * Helper to get the correct source based on theme.
 *
 * Checks the user's color scheme preference and returns the corresponding
 * video source URL from the video element's dataset.
 *
 * @param {HTMLVideoElement} video - The video element to retrieve the source from.
 * @param {string} type - The type of video source to retrieve ('idle', 'click', or 'poster').
 * @return {string|null} The video source URL or null if the video element is missing.
 */
function getVideoSource( video, type ) {
	const isDark = window.matchMedia && window.matchMedia( '(prefers-color-scheme: dark)' ).matches;
	const dataset = video.dataset;
	return isDark ? dataset[ type + 'Dark' ] : dataset[ type + 'Light' ];
}

/**
 * Play video.
 *
 * @param {HTMLVideoElement} video - The video element to play.
 * @param {string} type - The type of video source to retrieve ('idle', 'click', or 'poster').
 * @param {boolean} loop - Whether to loop the video.
 */
function playVideo( video, type, loop ) {
	const src = getVideoSource( video, type );

	if ( !src ) {
		return;
	}

	video.src = src;
	video.loop = loop;
	video.addEventListener( 'loadedmetadata', function onLoadedData() {
		video.removeEventListener( 'loadedmetadata', onLoadedData );
		video.width = 200;
		video.height = 200;
		video.play().catch( () => {} );
	} );
}

/**
 * Handle click on the video logo.
 *
 * Switches the video to the 'click' variant, plays it once without looping,
 * and then automatically reverts to the 'idle' looping video when playback ends.
 *
 * @param {HTMLVideoElement} video - The video element to play.
 * @return {Promise<void>} Resolves when the click video has finished playing.
 */
function playClickVideo( video ) {
	const idleSrc = getVideoSource( video, 'idle' );
	const clickSrc = getVideoSource( video, 'click' );

	if ( !clickSrc || !idleSrc ) {
		return Promise.resolve();
	}

	// Disable looping for the click video
	playVideo( video, 'click', false );

	// When finished, go back to idle
	const promise = new Promise( ( resolve ) => {
		video.addEventListener( 'ended', function onEnded() {
			video.removeEventListener( 'ended', onEnded );
			resolve();
		} );
	} ).catch( () => {} ).finally( () => {
		playVideo( video, 'idle', true );
	} );

	return promise;
}

/**
 * Wikipedia 25 Birthday Mode Toggle.
 *
 * Control the "Birthday Mode" feature. Default to enabled, persist the
 * disabled state via a session cookie, and toggle the CSS class on the document
 * to apply the celebration theme.
 */
( function () {
	const
		toggle = document.querySelector( '#wikipedia25-birthday-mode-toggle-switch' ),
		cookieName = 'wikipedia25-birthday-mode-disabled',
		bodyClass = 'wikipedia25-birthday-mode-enabled',
		isDisabled = document.cookie.includes( cookieName + '=1' );

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
	const
		video = document.querySelector( '#wikipedia25-video' ),
		backdrop = document.querySelector( '#wikipedia25-dialog-backdrop' ),
		closeButton = document.querySelector( '#wikipedia25-dialog-close-button' ),
		primaryButton = document.querySelector( '#wikipedia25-dialog-primary-button' ),
		ctaButton = document.querySelector( '#wikipedia25-cta-button' ),
		focusTrapStart = document.querySelector( '.wikipedia25-dialog-focus-trap-start' ),
		focusTrapEnd = document.querySelector( '.wikipedia25-dialog-focus-trap-end' );

	if ( !video || !backdrop || !closeButton || !primaryButton || !ctaButton ||
		!focusTrapStart || !focusTrapEnd ) {
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
		const dialog = backdrop.querySelector( '#wikipedia25-dialog' );
		if ( dialog ) {
			dialog.focus();
		}
	}

	function handleCTAClick() {
		window.open( 'https://wikimediafoundation.org/wikipedia25/wikipedia-mascot/?utm_campaign=eepp&utm_source=eepp&utm_medium=eepp', '_blank' );
	}

	// Open on video click
	video.addEventListener( 'click', openDialog );

	// Close on close button click
	closeButton.addEventListener( 'click', closeDialog );

	// Navigate on primary action button click
	primaryButton.addEventListener( 'click', handleCTAClick );

	// Navigate on CTA button click
	ctaButton.addEventListener( 'click', handleCTAClick );

	// Close on click outside (backdrop click)
	backdrop.addEventListener( 'click', ( e ) => {
		if ( e.target === backdrop ) {
			closeDialog();
		}
	} );

	// Close on Escape key
	document.addEventListener( 'keydown', ( e ) => {
		if ( e.key === 'Escape' && !backdrop.classList.contains( 'hidden' ) ) {
			closeDialog();
		}
	} );

	// Focus trap start logic
	focusTrapStart.addEventListener( 'focus', () => {
		if ( primaryButton ) {
			primaryButton.focus();
		} else if ( closeButton ) {
			closeButton.focus();
		}
	} );

	// Focus trap end logic
	focusTrapEnd.addEventListener( 'focus', () => {
		if ( closeButton ) {
			closeButton.focus();
		} else if ( primaryButton ) {
			primaryButton.focus();
		}
	} );

}() );

/**
 * Wikipedia 25 Video Interaction Handler.
 *
 * Inject the correct video source elements and handle video interactions.
 */
( function () {
	const video = document.getElementById( 'wikipedia25-video' ),
		playButton = document.querySelector( '#wikipedia25-play-button' );

	if ( !video || !playButton ) {
		return;
	}

	// Set initial video source and poster based on dark/light theme
	video.poster = getVideoSource( video, 'poster' );
	playVideo( video, 'idle', true );

	// Click handler
	let isHandlingClick = false;
	const clickHandler = () => {
		if ( isHandlingClick ) {
			return;
		}
		isHandlingClick = true;
		playButton.disabled = true;

		// Play random audio and the click video at the same time
		playRandomAudio();
		playClickVideo( video ).catch( () => {} ).finally( () => {
			isHandlingClick = false;
			playButton.disabled = false;
		} );
	};

	// Handle click on video click area
	playButton.addEventListener( 'click', clickHandler );

}() );
