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
	- **Gulp Tasks**
	- [Production Builds](prod.md)
	- [Deployment](deploy.md)
	- [Sister Project Portals](sister_portals.md)

---

## Running Gulp Tasks
Gulp is a dependancy of this repository, but it's also common to install Gulp globally with `npm install -g gulp`.

The Gulp tasks are designed to accommodate building all portal pages, not just the wikipedia.org portal (however, currently only the wikipedia.org portal is setup to build with the Gulp tasks). See the [Sister Project Portals](sister_portals.md) section for details.

The Gulp tasks take a `--portal` parameter to specify which portal directory the task should be run on. Until other project portals are brought into the Gulp workflow, this parameter will usually be `--portal=wikipedia.org`.

**The major Gulp tasks include:**

- `lint` - Lints JS and CSS.
- `compile-handlebars` - Compiles Handlebars templates.
- `svgSprite` - Creates the SVG sprite and it's PNG fallback.
- `postcss` - Compiles PostCSS.
- `inline-assets` - Inlines the CSS into the index.html file (for production build).
- `clean-prod-js` - Removes JS files from `prod` directory (for production build).
- `concat-minify-js` - Concatenates and minifies JS (for production build).
- `minify-html` - Cleans index.html (for production build).
- `copy-images` - Copies images to `prod` directory (for production build).
- `copy-translation-files` - Copies translation files from `src/wikipedia.org/assets/l10n` to `prod` (for production build).
- `update-urls-to-purge` - Updates `urls-to-purge.txt` file (for deployment).
- `fetch-meta` - downloads the latest versions of the sister project portals into the `prod` directory.

The command `gulp help` can be run to print out a list of the major gulp tasks on the command line.