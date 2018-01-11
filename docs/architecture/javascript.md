# Wikipedia.org technical Documentation
**TOC**

- [Overview](../README.md)
- Architecture of www.wikipedia.org
	- [Data sources](data.md)
	- [l10n](l10n.md)
	- [HTML](html.md)
	- [CSS](css.md)
	- [Images](images.md)
	- **JS**
- Development Process
	- [Getting Started](../development/getting_started.md)
	- [Gulp Tasks](../development/gulp.md)
	- [Production Builds](../development/prod.md)
	- [Deployment](../development/deploy.md)
	- [Sister Project Portals](../development/sister_portals.md)

---

## JavaScript
> JavaScript is linted with [eslint](https://eslint.org/) following [eslint-config-wikimedia](https://www.npmjs.com/package/eslint-config-wikimedia) and should follow the [MediaWiki JavaScript coding conventions](https://www.mediawiki.org/wiki/Manual:Coding_conventions/JavaScript).

The main JavaScript features of www.wikipedia.org include:

- client-side translation
- search-as-you-type suggestions with thumbnails and descriptions
- expanding/collapsing the wiki languages list
- event-logging
- And more!

All these features and more live in the `dev/wikipedia.org/assets/js` directory. JS features are separated into individual files, with each file being encapsulated in an [IIFE](https://en.wikipedia.org/wiki/Immediately-invoked_function_expression). If a features needs to be shared across different files, it is exposed as a global variable, assigned to an IIFE (see `wm-test.js` as an example). This lets us follow a [revealing module pattern](https://addyosmani.com/resources/essentialjsdesignpatterns/book/#revealingmodulepatternjavascript) for separate features.

There is no ES6 style module-loading on www.wikipedia.org. The javascript files are included in the order they are needed, before the closing body tag in the `index.handlebars` file. The script tags are placed between special comment tags starting with `<!-- build:js` . For a production build, the files between these comments are concatenated using [gulp-useref](https://www.npmjs.com/package/gulp-useref), given a cache-busing suffix with [gulp-rev](https://github.com/sindresorhus/gulp-rev) and minified with [gulp-uglify](https://www.npmjs.com/package/gulp-uglify). The minified JS file is then placed in the `prod` directory.

**JavaScript directory structure**

```
|- dev/
    |- wikipedia.org/
        |- index.handlebars      <- JS files are included here before the ending body tag
        |- index.html            <- compiled HTML includes links to JS source files for dev purposes
        |- assets
            |- js                <- source JS files
                |- polyfills.js
                |- wm-test.js
                |- etc...
|- prod/
    |- wikipedia.org/
        |- assets/
            |- js
                |- index-47f5f07682.js <- concatenated & minified JS file for production
```

