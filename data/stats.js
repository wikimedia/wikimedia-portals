var siteStats = require( './site-stats.json' ),
	siteDefsFormatting = require( './l10n-overrides.json' ),
	fs = require( 'fs' ),
	_ = require( 'underscore' ),
	merge = require( 'deepmerge' ),
	languageData = require( '@wikimedia/language-data' ),
	/** @type {Set.<string>} Languages for which language name warnings have already been issued */
	warnedLanguages = new Set(),
	Stats = {},
	siteDefs;

/**
 * Determine whether there is a notable difference between two names
 * for the same language. `<bdi>` wrapping and upper-case first letter
 * in the site definition are ignored.
 * @param {string} a Name in the site definition
 * @param {string} b Name in `language-data`
 * @returns {boolean} Whether the names differ
 */
function languageNamesDiffer( a, b ) {
	if ( a === b ) {
		// Fast path
		return false;
	}
	a = a.replace( /^<bdi dir="rtl">(.*)<\/bdi>$/, '$1' );
	b = b.replace( /^./, char => char.toUpperCase() );
	return a !== b;
}

/**
 * Print a warning to the console.
 * @param {string} code Language code, to avoid printing the warning if
 *  it has already been printed
 * @param {string} text
 * @param {boolean} [info=false] Whether the message is only informational
 *  (as opposed to a warning)
 */
function warn( code, text, info ) {
	if ( !warnedLanguages.has( code ) ) {
		console.log( ( info ? '\x1b[34mInfo' : '\x1b[33mWarning' ) + ':\x1b[0m %s', text );
		warnedLanguages.add( code );
	}
}

/**
 * Get the different names for a language, primarily from `siteDefs`,
 * falling back to `language-data`.
 * @param {string} code Code of the language
 * @returns {{name: string, sort?: string, latin?: string}}
 */
function getLanguageName( code ) {
	var siteDef = siteDefs[ code ],
		languageDataAutonym = languageData.getAutonym( code );
	if ( siteDef ) {
		var name = siteDef[ 'language-name' ],
			names = { name: name || languageDataAutonym };
		if ( !name ) {
			warn(
				code,
				`No 'language-name' for ${code}, using the one from @wikimedia/language-data (${languageDataAutonym})`
			);
		} else if ( languageNamesDiffer( name, languageDataAutonym ) ) {
			warn(
				code,
				`'language-name' for ${code} (${name}) differs from the one from @wikimedia/language-data (${languageDataAutonym})`,
				true
			);
		}
		if ( siteDef[ 'language-name-romanized-sorted' ] ) {
			names.sort = siteDef[ 'language-name-romanized-sorted' ];
		}
		if ( siteDef[ 'language-name-romanized' ] ) {
			names.latin = siteDef[ 'language-name-romanized' ];
		}
		return names;
	} else {
		warn(
			code,
			`No siteDef for ${code}, using name from @wikimedia/language-data (${languageDataAutonym})`
		);
		return { name: languageDataAutonym };
	}
}

Stats.readi18nFiles = function ( dirname ) {
	var siteDefinitions = {},
		fileNames = fs.readdirSync( dirname );

	fileNames.forEach( function ( filename ) {
		var fileContent = fs.readFileSync( dirname + filename, 'utf-8' ),
			langCode = filename.replace( '.json', '' );

		// T319137 skr translation file is named differently than
		// domain name and name in site-stats.json.
		if ( langCode === 'skr-arab') {
			langCode = 'skr';
		}

		siteDefinitions[ langCode ] = JSON.parse( fileContent );

		if ( siteDefsFormatting[ langCode ] ) {
			siteDefinitions[ langCode ] = merge(
				siteDefinitions[ langCode ], siteDefsFormatting[ langCode ] );
		}
	} );

	return siteDefinitions;
};

siteDefs = Stats.readi18nFiles( __dirname + '/../l10n/' );

Stats.nonStandardCodes = {
	'zh-min-nan': 'nan',
	'skr-arab': 'skr'
};
/**
 * Get top `n` wikis with most `criteria`.
 *
 * @param {string} portal The portal to look at: `wiki`, `wiktionary`...
 * @param {string} criteria The criteria to look at: `numPages` or `views`.
 * @param {number} n Greater than 0.
 * @return {Array} List of wikis {code: code, <criteria>: x}.
 */
Stats.getTop = function ( portal, criteria, n ) {

	// Validate
	var topViewed = _.filter( siteStats[ portal ], function ( stats, key ) {
		var siteDef = siteDefs[ key ],
			portalDef = siteDef && siteDef[ portal ];
		stats.code = key;
		return siteDef && portalDef;
	} );

	// Sort
	topViewed.sort( function ( a, b ) {
		return b[ criteria ] - a[ criteria ];
	} );

	// Return top 10
	topViewed = topViewed.slice( 0, n );

	// Return code only
	topViewed = _.map( topViewed, function ( wiki ) {
		var light = {
			code: wiki.code
		};
		light[ criteria ] = wiki[ criteria ];
		return light;
	} );

	return topViewed;
};

/**
 * Get wikis with `criteria` in the range [`from`, `to`].
 *
 * @param {string} portal The portal to look at: `wiki`, `wiktionary`...
 * @param {string} criteria The criteria to look at: `numPages` or `views`.
 * @param {number} from
 * @param {number} [to]
 * @return {Array} List of wikis {code: code, <criteria>: x}.
 */
Stats.getRange = function ( portal, criteria, from, to ) {

	// Validate
	var list = _.filter( siteStats[ portal ], function ( stats, code ) {
		var isInRange;

		stats.code = code;
		isInRange = stats[ criteria ] >= from &&
			( !to || stats[ criteria ] < to );

		return isInRange;
	} );

	// Sort alphabetically
	list.sort( function ( a, b ) {
		var aName = getLanguageName( a.code ),
			bName = getLanguageName( b.code ),
			asort = aName.sort || aName.latin || aName.name,
			bsort = bName.sort || bName.latin || bName.name;

		asort = asort.toLowerCase();
		bsort = bsort.toLowerCase();

		if ( asort < bsort ) {
			return -1;
		} else if ( asort > bsort ) {
			return 1;

		}
		return 0;
	} );

	// Return code only
	list = _.map( list, function ( wiki ) {
		var light = {
			code: wiki.code
		};
		light[ criteria ] = wiki[ criteria ];
		return light;
	} );

	return list;
};

/**
 * Gets a raw list and formats it to manipulate in templates.
 *
 * Example of input:
 *
 *     [ {code: 'en'} ]
 *
 * Example of output:
 *
 *     [
 *       {
 *         url: 'en.wikipedia.org',
 *         numPages: 5011495,
 *         views: 264805605,
 *         closed: false,
 *         code: 'en',
 *         siteName: 'Wikipedia',
 *         articles: 'articles',
 *         slogan: 'The Free Encyclopedia',
 *         index: 1,
 *         name: 'English',
 *         lang: 'en
 *       }
 *     ]
 *
 * @param {string} portal The portal to look at: `wiki`, `wiktionary`...
 * @param {Array} list Raw list of wiki.
 * @param {Object} [optionsArg]
 * @param {boolean} [optionsArg.stripTags=false] Tags are removed from the `name`.
 *  **Note:** this is only removing tags, it is not escaping the string nor
 *  making it secure.
 * @param {boolean} [optionsArg.merge=false] Whether subwikis should be merged or not.
 * @return {Array} List of wikis with all their information.
 */
Stats.format = function ( portal, list, optionsArg ) {
	var newList = [],
		newListByCode = {},
		options = optionsArg || {};

	/**
	 * Merges some wikis together.
	 *
	 * Is used to merge Norsk (Nynorsk) and Norsk (Bokmål).
	 *
	 * @param {string} parentCode
	 * @param {Object} wiki
	 * @private
	 */
	function mergeWikis( parentCode, wiki ) {
		var matches = /(.+)\(([^)]+)\)/.exec( wiki.name );

		newListByCode[ parentCode ] = newListByCode[ parentCode ] || {};
		newListByCode[ parentCode ].sublinks = newListByCode[ parentCode ].sublinks || [];
		newListByCode[ parentCode ].name = matches[ 1 ].trim();
		newListByCode[ parentCode ].parentCode = parentCode;

		wiki.name = matches[ 2 ];

		if ( wiki.code === parentCode ) {
			newListByCode[ parentCode ].sublinks.unshift( wiki );
		} else {
			newListByCode[ parentCode ].sublinks.push( wiki );
		}
	}

	// Format the list with all the information we have
	_.each( list, function ( top, index ) {

		var stats = siteStats[ portal ][ top.code ],
			siteDef = siteDefs[ top.code ],
			portalDef = siteDef && siteDef[ portal ],
			formatted = _.extend( {}, stats, portalDef, getLanguageName( top.code ) ),
			extendedl10n = [
				'language-button-text',
				'footer-description',
				'footer-donate',
				'app-links',
				'license',
				'terms',
				'privacy-policy',
				'terms-link',
				'privacy-policy-link',
				'other-languages-label',
				'wiki',
				'wiktionary',
				'wikibooks',
				'wikinews',
				'wikiquote',
				'wikisource',
				'wikiversity',
				'wikivoyage',
				'commons',
				'wikispecies',
				'wikidata',
				'mediawiki',
				'metawiki' ],
			nonStandardCode;

		formatted.index = ++index;
		formatted.siteName = ( portalDef && portalDef.name ) ? portalDef.name : siteDefs.en.name;
		formatted.lang = siteDef?.lang || formatted.code;

		if ( siteDef?.attrs ) {
			formatted.attrs = siteDef.attrs;
		}

		/**
		 * Get a raw list of a variant and formats it.
		 * @param {string} variant
		 * @private
		 * @returns list
		 */
		function getVariantList( variant ) {
			return _.extend(
				{},
				siteDefs[ variant ][ portal ],
				_.pick( siteDefs[ variant ], extendedl10n ),
				{
					lang: variant, // Used as HTML lang attribute
					code: variant, // Used in filename
				}
			);
		}

		if ( top.code === 'zh' ) {
			// Carry translations for simp and trad Chinese, used later in controller.js
			formatted.variants = {
				'zh-hans': getVariantList( 'zh-hans' ),
				'zh-hant': getVariantList( 'zh-hant' )
			};
		}

		if ( siteDef ) {
			extendedl10n.forEach( function ( prop ) {
				formatted[ prop ] = siteDef[ prop ];
			} );
		}

		if ( options.stripTags ) {
			// http://stackoverflow.com/a/5002161
			formatted.name = formatted.name.replace( /<\/?[^>]+(>|$)/g, '' );
		}

		// eslint-disable-next-line no-prototype-builtins
		if ( Stats.nonStandardCodes.hasOwnProperty( formatted.code ) ) {
			nonStandardCode = Stats.nonStandardCodes[ formatted.code ];
			top.code = nonStandardCode;
			formatted.code = nonStandardCode;
		}

		formatted.url = formatted.url.replace( 'https://', '' );

		if ( options.merge &&
			( formatted.code === 'nn' || formatted.code === 'no' || formatted.code === 'nb' )
		) {
			mergeWikis( 'no', formatted );
		} else {
			newListByCode[ formatted.code ] = formatted;
		}
	} );

	// Need to rebuild the list as some wikis may have been merged.
	_.each( list, function ( top ) {
		if ( newListByCode[ top.code ] ) {
			newList.push( newListByCode[ top.code ] );
		}
	} );

	return newList;
};

/**
 * @inheritdoc #getTop
 * @return {Array} A list formatted with {@link #format}.
 */
Stats.getTopFormatted = function ( portal, criteria, n ) {
	var list = this.getTop( portal, criteria, n );

	return this.format( portal, list );
};

/**
 * @inheritdoc #getRange
 * @return {Array} A list formatted with {@link #format}.
 */
Stats.getRangeFormatted = function ( portal, criteria, from, to ) {
	var list = this.getRange( portal, criteria, from, to );

	return this.format( portal, list, { merge: true } );
};

module.exports = Stats;
