/* eslint-env node, es6 */
var gulp = require( 'gulp' );

/**
 * @external Stream
 */

// Help
const { help } = require( './help' );

gulp.task( 'help', help );

/* Preliminary configuration
 =========================================================================== */

const { requirePortalParam, getConfig } = require( './config' );

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

const { postCSS, validatePostCSS, lintCSS } = require( './postcss' );

gulp.task( 'postcss', postCSS );

gulp.task( 'validate-postCSS', validatePostCSS );

gulp.task( 'lint-css', gulp.series( 'validate-postCSS', lintCSS ) );

const { inlineAssets, cleanProdJS, copyTranslationFiles, concatMinifyJS, minifyHTML, copyImages, createProdSymlink } = require( './prod' );

/**
 * Lint JS in src folder as well as in root folder.
 *
 * @return {Stream}
 */

const { lintJS } = require( './javascript' );

gulp.task( 'lint-js', lintJS );

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
function watch() {

	requirePortalParam();

	gulp.watch( getConfig().watch.sprites, gulp.parallel( 'svgSprite' ) );
	gulp.watch( getConfig().watch.hb, gulp.parallel( 'compile-handlebars' ) );
	gulp.watch( getConfig().watch.postcss, gulp.parallel( 'postcss' ) );

}
gulp.task( 'watch', gulp.series( 'svgSprite', 'compile-handlebars', 'postcss', watch ) );

gulp.task( 'lint', gulp.series( 'lint-js', 'lint-css' ) );

gulp.task( 'test', gulp.series( 'lint' ) );

gulp.task( 'default', gulp.series(
	'lint',
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
