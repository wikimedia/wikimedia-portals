# Contributing

> READ: [Technical Documentation](./docs/README.md)

These steps outline the wikipedia.org portal development process. Steps for updating all other Wikimedia Foundation portals are described in the [Updating Other Portal Pages](#updating-other-portal-pages) section.

The wikipedia.org portal page utilizes several pre/post processors to generate an optimized HTML page.

## Quick Start

> NOTE: You'll need [Gerrit access](https://www.mediawiki.org/wiki/Developer_access) to contribute code to this repository.

Prerequisites:

- Node
- npm

From the root of the repo, run:

```
npm install                       # install dependancies
gulp update-stats                 # update portal stats
gulp watch --portal=wikipedia.org # watch dev directory for changes
python -m SimpleHTTPServer 8080   # start a dev server
```

Visit `http://localhost:8080/dev/wikipedia.org` to see the changes in the `dev` directory.

Running `gulp help` will output a list of available gulp tasks.

*See the [Getting Started](./docs/development/getting_started.md) section of the technical documentation for more details.*

## Coding Style

1. [Mediawiki JavaScript coding conventions](https://www.mediawiki.org/wiki/Manual:Coding_conventions/JavaScript) - linted by [eslint-config-wikimedia](https://www.npmjs.com/package/eslint-config-wikimedia)
2. [Mediawiki CSS coding conventions](https://www.mediawiki.org/wiki/Manual:Coding_conventions/CSS) - linted by [stylelint-config-wikimedia](https://www.npmjs.com/package/stylelint-config-wikimedia)

## Directory Structure

The directory structure is divided into a development ('dev') directory and a production ('prod') directory. `prod` should not be edited directly, as its content will be overridden when running the build command `gulp --portal=wikipedia.org`.

````
|— package.json
|— gulpfile.js
|— dev/                                 development dir
|	|— wikipedia.org/
|		|— portal/                      symlink to '../' for mirroring prod server setup.
|		|— templates/                   Handlebars template partials
|		|— index.handlebars             Main Handlebars template
|		|—assets/
|			|— css/                     Compiled postCSS
|			|— img/                     Compiled sprites & non-sprite images
|				|— sprite_assets        Original sprite images
|			|— js/                      JavaScript files
|			|— postcss/                 postCSS files
|— prod                                 Compiled production dir
    |—wikipedia.org/
        |— index.html                   compiled from dev with inlined CSS
        |— assets/                      minimized & compressed assets
            |— img/
            |— js/

````

## Build

`gulp --portal=wikipedia.org` will generate the production version of the page and place it in `/prod/wikipedia.org/`. The production version contains JS and image assets that have been combined, uglified, minified, compressed and suffixed with a cache-busting file-name. **The contents of the `prod` directory should not be edited directly**.

*See the [Production Builds](./docs/development/prod.md) section of the technical documentation for more details.*


## Updating Translations
Translations are edited through translatewiki.net. To edit a translation, [visit this page](https://translatewiki.net/w/i.php?title=Special:Translate&filter=&group=wikimedia-portals&optional=1&task=custom), select the language you wish to translate to, and proceed to edit a translation. The translations will be merged into the repository automatically by a bot (l10n-bot).

*See [the l10n section](./docs/architecture/l10n.md) of the technical documentation for more details.*

## Updating Other Portal Pages
All other WMF project portals are still updated through their respective wiki templates on meta.wikimedia.org, (e.g [wiktionary portal](https://meta.wikimedia.org/wiki/Www.wiktionary.org_template) ). When these pages are updated through the wiki, they must then be copied into this repository in order to be deployed. They are copied using the gulp command `gulp fetch-meta --portal=wiktionary.org` to copy a single portal, or `gulp fetch-meta --portal=all` to copy the newest versions of all the portal pages (except for wikipedia.org) into the repo.

*See the [Sister Project Portals](./docs/development/sister_portals.md) section of the technical documentation for more details.*

