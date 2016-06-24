# Site Data & Stats scripts

This directory contains scripts that gather page-view, article-count and translation data about all the portal pages. 

## site-defs.json 
A JSON file that was ported from a [Lua definition](https://meta.wikimedia.org/wiki/Module:Project_portal/wikis) file which was used to generate the 
portal pages. The Lua definitions contain text that is used across all portals, however this json version is currently only used to generate the wikipedia.org page. 

## site-stats.js
This file gets page-counts via a [WMF Labs Tools](https://tools.wmflabs.org/pagecounts/pagecounts.json) endpoint as well as database dumps of pageviews for each wiki. 
It exports a `getSiteStats` function that executes the actual code. This function is run through `gulp update-stats` and outputs the file `site-stats.json`.

## site-stats.json
Output of `site-stats.js`. Contains article-counts, page-views, and urls for all wikis. 

## stats.js
Merges the `site-stats.json` and `new-site-defs.json` files together and exposes functions for ranking the wikis.
Also formats the data for use on the portal page, like strips tags from strings. This file is used to define variables for Handlebars templates in `/dev/wikipedia.org/controller.js`.


