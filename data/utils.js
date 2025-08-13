'use strict';

let fs = require( 'fs' ),
	glob = require( 'glob' ),
	numOfDays;

/**
 * Delete files in a directory
 *
 * @param {string} loc directory location
 * @param {number} days number of days
 */
function deleteFiles( loc, days ) {
	function unlinkFile( fileName ) { // Delete file
		fs.unlink( loc + fileName, ( error ) => {
			if ( error ) {
				console.error( 'Error deleting the file: ', error );
			}
		} );
	}

	function checkStats( error, fileStats, fileName ) {
		// Check if number of days >= days mentioned
		if ( error ) {
			console.error( 'Error finding the stats: ', error );
		} else {
			numOfDays = ( ( Date.now() - fileStats.mtime.getTime() ) / ( 24 * 60 * 60 * 1000 ) );
			if ( numOfDays >= days ) {
				unlinkFile( fileName );
			}
		}
	}

	function findFiles( error, files ) {
		if ( error ) {
			console.error( 'Cannot find files: ', error );
		} else {
			files.forEach( ( fileName ) => {
				fs.stat( loc + fileName, ( err, fileStats ) => {
					// Find stats for each file
					checkStats( err, fileStats, fileName );
				} );
			} );
		}
	}

	glob( '*', { cwd: loc }, findFiles );
}

module.exports = deleteFiles;
