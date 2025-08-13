'use strict';

let argv = require( 'yargs' ).argv,
	portalParam = argv.portal,
	getBaseDir, getProdDir, getConfig;

/**
 * Preliminary task for tasks that require the portal param.
 * Also sets config for remaining tasks.
 */

function requirePortalParam() {
	if ( !portalParam ) {
		console.log( '\x1b[31m' );
		console.log( 'Error: please specify the portal you wish to build.' );
		console.log( 'Type gulp help for more information.' );
		console.log( '\x1b[0m' );
		process.exit( 1 );
	}
}

getBaseDir = function () {
	requirePortalParam();

	getBaseDir = function () {
		return 'src/' + portalParam + '/';
	};
	return getBaseDir();
};

getProdDir = function () {
	requirePortalParam();

	getProdDir = function () {
		return 'prod/' + portalParam + '/';
	};
	return getProdDir();
};

getConfig = function () {
	let config = {},
		baseDir, prodDir;

	baseDir = getBaseDir();
	prodDir = getProdDir();

	config.hb = {
		src: baseDir + 'index.handlebars',
		// eslint-disable-next-line security/detect-non-literal-require
		templateData: require( '../' + baseDir + 'controller.js' ),
		options: {
			batch: [ './src/common/templates', './' + baseDir + '/templates' ],
			helpers: require( '../hbs-helpers.global' )
		}
	};

	config.htmlmin = {
		src: prodDir + 'index.html',
		dest: prodDir + 'index.html',
		options: {
			preventAttributesEscaping: true,
			collapseWhitespace: true,
			preserveLineBreaks: true,
			collapseBooleanAttributes: false
		}
	};

	config.watch = {
		sprites: [ baseDir + 'assets/img/sprite_assets/**/*' ],
		postcss: baseDir + 'assets/postcss/*.css',
		hb: [ baseDir + '*.handlebars',
			baseDir + '.json',
			baseDir + 'controller.js',
			baseDir + 'templates/**/*',
			'./src/common/templates'
		]
	};

	config.img = {
		src: [ baseDir + 'assets/img/*', '!' + baseDir + 'assets/img/sprite_assets' ],
		dest: prodDir + 'assets/img',
		sprite: {
			cssPrefix: 'sprite',
			assets: baseDir + 'assets/img/sprite_assets/*.svg',
			outputName: 'sprite',
			outputCSS: 'sprite.css',
			outputCSSPath: baseDir + 'assets/css/sprite.css',
			outputSVGGlob: baseDir + 'assets/img/sprite*.svg',
			template: baseDir + 'assets/css/sprite-template.mustache'
		}
	};

	getConfig = function () {
		return config;
	};
	return getConfig();
};

exports.requirePortalParam = requirePortalParam;
exports.getBaseDir = getBaseDir;
exports.getProdDir = getProdDir;
exports.getConfig = getConfig;
