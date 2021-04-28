var gulp = require( 'gulp' ),
	gulpLoadPlugins = require( 'gulp-load-plugins' ),
	del = require( 'del' ),
	plugins = gulpLoadPlugins();

const { getBaseDir, getConfig } = require( './config' );

function cleanSprites() {
	var conf = getConfig();
	return del( [ conf.img.sprite.outputSVGGlob ] );
}

function createSvgSprite() {
	var conf = getConfig();
	return gulp.src( conf.img.sprite.assets )
		.pipe( plugins.svgSprite( {
			shape: {
				spacing: {
					padding: 1
				},
				transform: [ 'svgo' ]
			},
			mode: {
				css: {
					layout: 'vertical',
					sprite: '../' + conf.img.sprite.outputName + '.svg',
					bust: true,
					dimensions: true,
					common: conf.img.sprite.cssPrefix,
					render: {
						css: {
							dimensions: true,
							dest: '../' + conf.img.sprite.outputCSS,
							template: conf.img.sprite.template
						}
					}
				}
			},
			variables: {
				mapname: 'svg-sprite'
			}
		} ) )
		.pipe( plugins.if( '*.svg', gulp.dest( getBaseDir() + 'assets/img/' ), gulp.dest( getBaseDir() + 'assets/css/' ) ) );
}

exports.cleanSprites = cleanSprites;
exports.createSvgSprite = createSvgSprite;
