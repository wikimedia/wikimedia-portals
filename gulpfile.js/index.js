/* eslint-env node, es6 */
var gulp = require( 'gulp' );

/**
 * @external Stream
 */

// Help
const { help } = require( './help' );

gulp.task( 'help', help );

/* List of tasks
 =========================================================================== */

/**
 * Compile Handlebars templates into src folder.
 * Execute 'build' task if config is undefined
 *
 * @return {Stream}
 */
const { compileHandlebars } = require( './handlebar' );

gulp.task( 'compile-handlebars', compileHandlebars );

/**
 * Compile postCSS files into regular CSS and
 * output them into the CSS src folder.
 *
 * @return {Stream}
 */

const { postCSS, validatePostCSS } = require( './postcss' );

gulp.task( 'postcss', postCSS );

gulp.task( 'validate-postCSS', validatePostCSS );

const { inlineAssets, cleanProdJS, copyTranslationFiles, concatMinifyJS, minifyHTML, copyImages, createProdSymlink } = require( './prod' );

const { updateStats } = require( './stats' );

gulp.task( 'update-stats', updateStats );

const { fetchMeta } = require( './meta' );

gulp.task( 'fetch-meta', fetchMeta );

/**
 * Remove existing SVG sprite before generating a new one.
 *
 * @return {Stream}
 */

const { cleanSprites, createSvgSprite } = require( './sprites' );

gulp.task( 'cleanSprites', cleanSprites );

/**
 * Create SVG sprite for use as a CSS background images.
 * Combine SVG images from the assets/img/sprite_assets directory in the src folder.
 * Output the SVG sprite in the assets/img dir as sprite-*.svg, where * is a cachebusting hash.
 *
 * Also outputs a CSS file for the SVG sprite named sprite.css in the src CSS folder.
 *
 * @return {Stream}
 */

gulp.task( 'createSvgSprite', gulp.series( 'cleanSprites', createSvgSprite ) );

gulp.task( 'svgSprite', gulp.series( 'createSvgSprite' ) );

/**
 * Create a 'urls-to-purge.txt' file at the root of the repo that
 * contains a list of URL's that must be purged from the server cache.
 * These URLs include the root portal urls for all portals and all
 * production asset URLs in this repo.
 *
 * Must be run when after all assets have been versioned, minified &
 * copied into the prod dir.
 *
 * @return {Stream}
 */

const { updateURLsToPurge } = require( './scap-urls' );

/**
 * Watch for changes in src folder and compile:
 * - handlebars templates
 * - postCSS files
 * into src folder.
 */
const { watch } = require( './dev' );

gulp.task( 'watch', gulp.series( 'svgSprite', 'compile-handlebars', 'postcss', watch ) );

gulp.task( 'default', gulp.series(
	'svgSprite',
	'compile-handlebars',
	'postcss',
	inlineAssets,
	cleanProdJS,
	concatMinifyJS,
	minifyHTML,
	copyImages,
	copyTranslationFiles,
	createProdSymlink,
	updateURLsToPurge
) );
