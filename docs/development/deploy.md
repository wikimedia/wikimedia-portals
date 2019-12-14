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
	- [Production Builds](prod.md)
	- **Deployment**
	- [Sister Project Portals](sister_portals.md)

---

## Creating a deployment patch

The Wikimedia Portals are placed in a submodule in the `mediawiki-config` repository. To Deploy a new build of the Wikimedia portals, a new patch that updates the submodule must be submitted to `mediawiki-config`.

From the `mediawiki-config` repository, run `git submodule init portals` (on first run), then `git submodule update --remote portals` to bump the portals to the head of the master branch. Then, create a commit with the message

```
Bumping portals to master

Bug: T128546
```

and push the commit to Gerrit. The commit should be merged just before a deployment is about to take place.

## Deploying the Wikimedia portals
From the deployment server (deploy1001), run

```
cd /srv/mediawiki-staging && git pull && git submodule update portals
```

To test the portals on mwdebug, login to a debug server (e.g. mwdebug1001) and run

```
scap pull
```

If all looks well, then on the deployment server, run

```
cd portals/
./sync-portals 'Wikimedia Portals Update: [[gerrit:{{patchID}}|Bumping portals to master (T128546)]]'
```

Where `{{patchID}}` is the patch ID of the `mediawiki-config` patch that updates the portals submodule.

The script `.sync-portals` runs scap and purges all the urls listed in the `urls-to-purge.txt` file at the root of the repo.
