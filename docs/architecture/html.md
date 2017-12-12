# Wikipedia.org technical Documentation
**TOC**

- [Overview](../README.md)
- Architecture of www.wikipedia.org
	- [Data sources](data.md)
	- [l10n](l10n.md)
	- **HTML**
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
## HTML templates
[Handlebars](http://handlebarsjs.com/) is used as the HTML template language. The reason that Handlebars was chosen for this purpose is that it provides the ability to use conditionals in templates, as well the ability to define custom helper functions, which are located in the root of the repo in the `hbs-helpers.global.js` file.

Handlebars templates are compiled to HTML in a Gulp task using the [gulp-compile-handlebars](https://www.npmjs.com/package/gulp-compile-handlebars) plugin. This plugin uses data defined in the  `controller.js` file to populate the templates. The templates consist of a main template,  `index.handlebars`, and 'partial' templates, which get included in the main template. `index.handlebars` gets compiled into `index.html` and outputted into the dev directory during development, and optimizes and copied to the `prod` directory for production.

**Template directory overview**

```
|- dev/
    |- wikipedia.org/
        |- index.handlebars         <- main handlebars template, combines partials
        |- index.html               <- compiles handlebars template for dev
        |- controller.js            <- retrieves template data & outputs l10n files
        |- templates/               <- template partials
            |- header.handlebars
            |- footer.handlebars
            |- etc...
|- hbs-helpers.global.js            <- handlebars helper functions
```
