# Site Data & Stats scripts

This directory contains scripts that gather page-view, article-count and translation data about all the portal pages.

## site-stats.js
This file gets page-counts via a [pagecounts](https://pagecounts.toolforge.org/pagecounts.json) endpoint on Wikimedia Toolforge, as well as database dumps of pageviews for each wiki.
It exports a `getSiteStats` function that executes the actual code. This function is run through `gulp update-stats` and outputs the file `site-stats.json`.

## stats.js
Merges the `site-stats.json` and `new-site-defs.json` files together and exposes functions for ranking the wikis.
Also formats the data for use on the portal page, like strips tags from strings. This file is used to define variables for Handlebars templates in `/src/wikipedia.org/controller.js`.
