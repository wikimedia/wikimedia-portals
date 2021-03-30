# Wikipedia.org technical Documentation
**TOC**

- [Overview](../README.md)
- Architecture of www.wikipedia.org
	- **Data sources**
	- [l10n](l10n.md)
	- [HTML](html.md)
	- [CSS](css.md)
	- [Images](images.md)
	- [JS](javascript.md)
- Development Process
	- [Getting Started](../development/getting_started.md)
	- [Gulp Tasks](../development/gulp.md)
	- [Production Builds](../development/prod.md)
	- [Deployment](../development/deploy.md)
	- [Sister Project Portals](../development/sister_portals.md)

---
## Data sources

In order to populate the wikipedia.org page with up-to-date article counts and translation strings, we use three sources of data:

1. **Page-count data** retrieved from Wikimedia Toolforge database replicas, by [page-counts.json](https://github.com/MaxSem/pagecounts), a tool hosted on Wikimedia Toolforge that retrieves article counts of all Wikimedia projects, and outputs them in JSON format.
2. **Page-View data** retrieved from the [Wikimedia data dumps](https://dumps.wikimedia.org/other/pageviews/) by the `site-stats.js` script in the `data` folder. This script pulls down the hourly page-view data (formatted as CSV) for each project and places them in the `cache` folder. The script then parses the data, which is used to order the top-ten links around the globe.
3. **l10n** strings retrieved from translatewiki, which get pushed to the repo by an automated bot and placed in the `l10n` folder at the root of the repo.

The scripts in the `data` directory assemble the page-counts, view-counts and translations for each project, and write the resulting file `site-stats.json`, which contains all three of these data sources, to the `data` directory. This file, along with the methods in `stats.js`, provide the data that can be consumed by the HTML templates.

**Data directory overview**

```
data/
    |- site-stats.json      <- file with combined page-counts & page-views
    |- site-stats.js        <- pulls down page-view data & generates site-stats.json
    |- stats.js             <- methods for retrieving site-stats ranges and l10n
    |- l10n-overrides.json  <- additional non-standard l10n data
l10n/                       <- l10n strings from translatewiki
    |- en.json
    |- fr.json
    |- etc...
```
