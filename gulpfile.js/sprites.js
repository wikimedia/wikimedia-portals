'use strict';

const gulp = require( 'gulp' ),
	gulpLoadPlugins = require( 'gulp-load-plugins' ),
	fs = require( 'fs' ),
	glob = require( 'glob' ),
	plugins = gulpLoadPlugins();

const { getBaseDir, getConfig } = require( './config' );

function cleanSprites() {
	const conf = getConfig();
	const outputSVGGlob = conf.img.sprite.outputSVGGlob;
	const outputSVGFiles = glob.sync( outputSVGGlob );

	return Promise.all( outputSVGFiles.map( ( file ) => new Promise( ( resolve, reject ) => {
		fs.unlink( file, ( err ) => {
			if ( err ) {
				reject( err );
			} else {
				console.log( `Sprite file deleted: ${ file }` );
				resolve();
			}
		} );
	} ) ) );
}

function createSvgSprite() {
	const conf = getConfig();
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
