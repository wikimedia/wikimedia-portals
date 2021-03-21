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
	- **Getting Started**
	- [Gulp Tasks](gulp.md)
	- [Production Builds](prod.md)
	- [Deployment](deploy.md)
	- [Sister Project Portals](sister_portals.md)

---

## Getting Started

Prerequisites:
- Node v6.11 or greater
- NPM v3.8 or greater

To download all dependencies, run:

```
npm install
```

### Starting a development server

To view changes you make while developing, you will need to run a development server pointing to the root of this repository. This can be as easy as running one of the following commands from the root directory of the portals repository.

```
npm run dev-server
```

**Note** You can update the page stats, watch for changes in the wikipedia.org dev dir, and start a dev server by using a single command

```
npm run start 
```

Then, you should be able to access the development directory at `http://localhost:8080/src/wikipedia.org` and the production directory at `http://localhost:8080/prod/wikipedia.org`.

### Watching for changes

To watch for changes while you're developing, run:

```
gulp watch --portal=wikipedia.org
```

This will watch for changes in `src/wikipedia.org` and recompile the HTML/CSS/JS and images if they change. The changes will be visible when then browser is reloaded.

### Updating Stats
To download the latest stats (article-counts and page-views) for the portal pages, run:

```
gulp update-stats
```

After that task completes, the next time you run the watch command the wikipedia.org dev page will be updated with the latest stats.