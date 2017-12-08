# Wikipedia.org technical Documentation
**TOC**

- [Overview](../README.md)
- Architecture of www.wikipedia.org
	- [Data sources](data.md)
	- [l10n](l10n.md)
	- [HTML](html.md)
	- **CSS**
	- [Images](images.md)
	- [JS](javascript.md)
- Development Process
	- [Getting Started](../development/getting_started.md)
	- [Gulp Tasks](../development/gulp.md)
	- [Production Builds](../development/prod.md)
	- [Deployment](../development/deploy.md)
	- [Sister Project Portals](../development/sister_portals.md)

---
## CSS
CSS is processed using [PostCSS](http://postcss.org/). This processor provides features such as auto-prefixing and future friendly CSS capabilities like CSS custom-properties (variables). CSS is also linted with Stylelint, using [wikimedia-stylelint-config](https://github.com/wikimedia/stylelint-config-wikimedia). CSS is divided into a ‘main’ `style.css` file and 'partials', which are CSS files starting with an underscore that get imported into the main CSS file. Imports are done using [postcss-import](https://github.com/postcss/postcss-import). This plugin allows us to create a “SASS” style CSS structure, with many partials and one main file. It  also allows us to import styles from NPM modules, such as the variables defined in [wikimedia-ui-base.css](https://phabricator.wikimedia.org/source/wikimedia-ui-base/browse/master/wikimedia-ui-base.css) .

Processed CSS is outputted to the `dev/wikipedia.org/assets/css` folder for development. For production, the CSS is minified and **inlined** into the `index.html` file to reduce HTTP requests. A special CSS related file, `sprite-template.mustache` is also defined in `dev/wikipedia.org/assets/css`. This file is the template for the SVG image sprite, which uses CSS backgrounds to place images on the wikipedia.org page. The sprite template is compiled into a `sprite.css` file and outputted to the same directory. It is also minified and inlined for production purposes.

**CSS directory overview**

```
|- dev/
    |- wikipedia.org/
        |- assets
            |- css
                |- sprite-template.mustache <- sprite CSS template
                |- sprite.css               <- compiled sprite CSS template
                |- style.css                <- compiled main PostCSS file
            |- postcss
                |- style.css                <- main postCSS file
                |- _footer.css              <- partial postCSS files
                |- etc...
```
