const gulp = require( 'gulp' );

const { requirePortalParam, getConfig } = require( './config' );

function watch() {

	requirePortalParam();

	gulp.watch( getConfig().watch.sprites, gulp.parallel( 'svgSprite' ) );
	gulp.watch( getConfig().watch.hb, gulp.parallel( 'compile-handlebars' ) );
	gulp.watch( getConfig().watch.postcss, gulp.parallel( 'postcss' ) );

}

exports.watch = watch;
