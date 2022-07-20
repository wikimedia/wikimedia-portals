// Help
function help( cb ) {
	const helpinfo = `
	+-------------------------------------------------------------------------------------------------+
	|                                     =====  USAGE =====                                          |
	+-------------------------------------------------------------------------------------------------+
	| GLOBAL TASKS :                                                                                  |
	|                                                                                                 |
	| gulp update-stats                           - update file containing projects stats             |
	+-------------------------------------------------------------------------------------------------+
	| PORTAL-SPECIFIC TASKS :                                                                         |
	|                                                                                                 |
	| gulp watch --portal wikipedia.org           - watches src directory and generates an index.html |
	|                                               file in it without inlined/minified assets        |
	| gulp --portal wikipedia.org                 - run all of the above on the specified portal page |
	|                                                                                                 |
	| gulp fetch-meta --portal wikipedia.org      - overwrite the portal page with source from Meta   |
	+-------------------------------------------------------------------------------------------------+
	                                                                                                   `;
	console.log( helpinfo );
	cb();
}

exports.help = help;
