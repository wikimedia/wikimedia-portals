/* jshint strict:false */
/* globals require */
/* globals module */
var siteStats = require( './site-stats.json' ),
	siteDefsFormatting = require( './l10n-overrides.json' ),
	fs = require( 'fs' ),
	_ = require( 'underscore' ),
	merge = require( 'deepmerge' );

var Stats = {};

Stats.readi18nFiles = function ( dirname ) {
	var siteDefs = {},
		fileNames = fs.readdirSync( dirname );

	fileNames.forEach( function ( filename ) {
		var fileContent = fs.readFileSync( dirname + filename, 'utf-8' ),
		langCode = filename.replace( '.json', '' );
		siteDefs[ langCode ] = JSON.parse( fileContent );

		if ( siteDefsFormatting[ langCode ] ) {
			siteDefs[ langCode ] = merge( siteDefs[ langCode ], siteDefsFormatting[ langCode ] );
		}
	} );

	return siteDefs;
};

var siteDefs = Stats.readi18nFiles(  __dirname + '/../l10n/' );

Stats.nonStandardCodes = {
	'zh-min-nan': 'nan'
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

	// validate
	var topViewed = _.filter( siteStats[ portal ], function ( stats, key ) {
		var siteDef = siteDefs[ key ],
			portalDef = siteDef && siteDef[ portal ];
		stats.code = key;
		return siteDef && siteDef[ 'language-name' ] && portalDef;
	} );

	// sort
	topViewed.sort( function ( a, b ) {
		return b[ criteria ] - a[ criteria ];
	} );

	// return top 10
	topViewed = topViewed.slice( 0, n );

	// return code only
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

	// validate
	var list = _.filter( siteStats[ portal ], function ( stats, code ) {

		if ( !siteDefs[ code ] || !siteDefs[ code ][ 'language-name' ] ) {
			return false;
		}

		stats.code = code;
		var isInRange = stats[ criteria ] >= from &&
			( !to || stats[ criteria ] < to );

		return isInRange;
	} );

	// sort alphabetically
	list.sort( function ( a, b ) {
		var asort = siteDefs[ a.code ][ 'language-name-romanized-sorted' ] || siteDefs[ a.code ][ 'language-name-romanized' ] || siteDefs[ a.code ][ 'language-name' ],
			bsort = siteDefs[ b.code ][ 'language-name-romanized-sorted' ] || siteDefs[ b.code ][ 'language-name-romanized' ] || siteDefs[ b.code ][ 'language-name' ];

		asort = asort.toLowerCase();
		bsort = bsort.toLowerCase();

		if ( asort < bsort ) {
			return -1;
		} else if ( asort > bsort ) {
			return 1;

		}
		return 0;
	} );

	// return code only
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
 * @param {Object} [options]
 * @param {boolean} [options.stripTags=false] Tags are removed from the `name`.
 *  **Note:** this is only removing tags, it is not escaping the string nor
 *  making it secure.
 * @param {boolean} [options.merge=false] Whether subwikis should be merged or not.
 * @return {Array} List of wikis with all their information.
 */
Stats.format = function ( portal, list, options ) {
	options = options || {};

	var newList = [],
		newListByCode = {};

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
		newListByCode[ parentCode ] = newListByCode[ parentCode ] || {};
		newListByCode[ parentCode ].sublinks = newListByCode[ parentCode ].sublinks || [];

		var matches = /(.+)\(([^)]+)\)/.exec( wiki.name );

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
			formatted = _.extend( {}, stats, portalDef );

		formatted.index = ++index;
		formatted.name = siteDef[ 'language-name' ];
		formatted.siteName = ( portalDef && portalDef.name ) ? portalDef.name : siteDefs.en.name;
		formatted.lang = siteDef.lang || formatted.code;

		if ( siteDef[ 'language-name-romanized-sorted' ] ) {
			formatted.sort = siteDef[ 'language-name-romanized-sorted' ];
		}
		if ( siteDef[ 'language-name-romanized' ] ) {
			formatted.latin = siteDef[ 'language-name-romanized' ];
		}
		if ( siteDef.attrs ) {
			formatted.attrs = siteDef.attrs;
		}

		if ( options.stripTags ) {
			// http://stackoverflow.com/a/5002161
			formatted.name = formatted.name.replace( /<\/?[^>]+(>|$)/g, '' );
		}

		if ( Stats.nonStandardCodes.hasOwnProperty( formatted.code ) ) {
			var nonStandardCode = Stats.nonStandardCodes[ formatted.code ];
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

/*REMOVE*/
// Stats.getRangeFormatted( 'wiki', 'numPages', 0 )

module.exports = Stats;
