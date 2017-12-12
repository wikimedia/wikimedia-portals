# Wikipedia.org technical Documentation
**TOC**

- [Overview](../README.md)
- Architecture of www.wikipedia.org
	- [Data sources](../architecture/data.md)
	- [l10n](../architecture/l10n.md)
	- [HTML](../architecture/html.md)
	- [CSS](../architecture/css.md)
	- [Images](../architecture/images.md)
	- [JS](../architecture/javascript.md)
- Development Process
	- [Getting Started](getting_started.md)
	- [Gulp Tasks](gulp.md)
	- **Production Builds**
	- [Deployment](deploy.md)
	- [Sister Project Portals](sister_portals.md)

---

## Creating a Production Build

A build of the Wikimedia portals is created automatically each week by a Jenkins Job in CI that runs every mondays at 9:30 A.M. UTC.
This build is run by the `PortalsBuilder` user, whose patch history can be [viewed here](https://gerrit.wikimedia.org/r/#/q/owner:releng%2540lists.wikimedia.org).
A changelog of each build is also available and can be [viewed here](https://integration.wikimedia.org/ci/job/wikimedia-portals-build/changes).

It is also possible to manually create a new build in the event that an error must be immediately fixed.
To run a manual build, first update the stats, then run the following commands:

1. `gulp update-stats` Updates stats.
2. `gulp --portal=wikipedia.org` Runs the build of wikipedia.org.
3. `gulp fetch-meta --portal=all` Fetch updates for the remaining project portals
4. Commit the changes to Gerrit.

These Gulp task have also been combined into a single NPM script: `npm run build-all-portals`.

Running a build produces a high amount of changes in Git because each l10n file is appended with a cache-busting hash at the end of the file name. When a single translation changes, all the translations get updated with a new cache-busting hash, and therefore, all the l10n file names get changed as well. For this reason, it is typically not necessary to commit a new build of the portals for each patch submitted to Gerrit.