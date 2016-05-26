# Wikipedia.org Portal Development

These steps outline the wikipedia.org portal development process. Steps for updating all other Wikimedia Foundation portals are described in the [Updating Other Portal Pages](#updating-other-portal-pages) section.  

The wikipedia.org portal page utilizes several pre/post processors to generate an optimized HTML page.

### Installation

Prerequisites:
- node
- npm 

`npm install` and grab a coffee (that'll take a few minutes). The portal page has numerous dev dependencies, all of which are listed in the `package.json` file. Some of the main dev dependencies include the following: 

 - [Gulp](http://gulpjs.com/) - task runner
 - [PostCSS](http://postcss.org/) & [cssnext](http://cssnext.io/) - CSS pre-processors
 - [Handlebars](http://handlebarsjs.com/) - html templates
 - [Imagemin](https://www.npmjs.com/package/gulp-imagemin) & [sprity](https://www.npmjs.com/package/sprity) - image optimization and CSS background sprite generator 
 - [JSHint](http://jshint.com/) & [JSCS](http://jscs.info/) - JS code style validators 
 - [PhantomJS](http://phantomjs.org/) & [CasperJS](http://casperjs.org/) - for running tests 

All these tools and more, are executed through gulp tasks. 

Running `gulp help` will output a list of available gulp tasks. The output might look something like this.


````
+-------------------------------------------------------------------------------------------------+
|                                     =====  USAGE =====                                          |
+-------------------------------------------------------------------------------------------------+
| GLOBAL TASKS :                                                                                  |
|                                                                                                 |
| gulp lint                                   - run jslint on all JS files                        |
| gulp update-stats                           - update file containing projects stats             |
+-------------------------------------------------------------------------------------------------+
| PORTAL-SPECIFIC TASKS :                                                                         |
|                                                                                                 |
| gulp lint --portal wikipedia.org            - run jslint on JS files on portal JS files         |
| gulp inline-assets --portal wikipedia.org   - build inline CSS and JS assets                    |
| gulp optimize-images --portal wikipedia.org - run imagemin on image directory                   |
| gulp watch --portal wikipedia.org           - watches dev directory and generates an index.html |
|                                               file in it without inlined/minified assets        |
| gulp --portal wikipedia.org                 - run all of the above on the specified portal page |
|                                                                                                 |
| gulp fetch-meta --portal wikipedia.org      - overwrite the portal page with source from Meta   |
+-------------------------------------------------------------------------------------------------+
````


### Directory Structure

The directory structure is divided into a development ('dev') directory and a production ('prod') directory. `prod` should not be edited directly, as its content will be overridden when running the build command `gulp --portal wikipedia.org`.  

````
|— package.json
|— gulpfile.js
|— dev/                                 development dir
|	|— wikipedia.org/
|		|— portal/                      symlink to '../' for mirroring prod server setup.
|		|— templates/                   Handlebars template partials
|		|— index.handlebars             main Handlebars template
|		|—assets/
|			|— css/                     compiled postCSS
|			|— img/                     compiled sprites & non-sprite images
|				|— sprite_assets        original sprite images
|			|— js/                      javascript files
|			|— postcss/                 postCSS files
|— prod                                 Compiled production dir
    |—wikipedia.org/
        |— index.html                   compiled from dev with inlined CSS
        |— assets/                      minimized & compressed assets
            |— img/
            |— js/

````

#### Starting Development

Afer running `npm install`, you will probably run `gulp watch --portal wikipedia.org` during most of your time coding. This task watches for changes in `dev/wikipedia.org/` and generate an `index.html` file at `dev/wikipedia.org/index.html`. This file contains un-minified JS & CSS assets, making it easy to debug. CSS development is done using the PostCSS preprocessor. Consult the README file at `dev/wikipedia.org/assets/postcss/README.txt` for more details on PostCSS. Javascript development does not require any pre-processing, but must conform to [WMF coding conventions](https://www.mediawiki.org/wiki/Manual:Coding_conventions/JavaScript) and pass linting with JSHint.


### Article-count & Wiki Ranking Files

The command `gulp update-stats` updates the article-counts and rankings for the wikipedia.org portal page. To see these changes actually reflected on the page, run `gulp watch --portal wikipedia.org`. This will generate a new development version of the page in the `/dev` directory. Then run `gulp --portal wikipedia.org` to build a new production version of the page with the new article counts and rankings.

The following files are responsible for populating the data on the portal page.

````
|— site-defs.json       static file copied from https://meta.wikimedia.org/wiki/Module:Project_portal/wikis
|— site-stats.js        generates the site-stats.json file
|— site-stats.json      contains per-wiki pageviews and article counts
|— stats.js             combines site-stats.json & site-defs.json into an exported Stats variable
|— dev/
    |— wikipedia.org/
        |— other-projects.json      text for sister projects.
        |— other-languages.json     text for 'other languages' section on portal.
        |— controller.js            Handlebars helper that organizes wikis by ranking.
````

### Build

`gulp --portal wikipedia.org` will generate the production version of the page and place it in `/prod/wikipedia.org/`. The production version contains JS and image assets that have been combined, uglified, minified, compressed and suffixed with a cache-busting file-name. The contents of `prod` should not be edited directly.

### Testing

`npm test` will run a basic Javascript linting test on all the JS code in the repo.  

Integration tests have been created to verify that event-logging used by the WMF for analytics and A/B testing purposes is functional. Tests are located in the `/tests` folder and are run through PhantomJS and Casper.js. More documentation on these tests, including how to run them and what they test, are found in the comments in each file. 

## Updating Other Portal Pages
All other WMF project portals are still updated through their respective wiki pages on meta.wikimedia.org, (e.g [wiktionary portal](https://meta.wikimedia.org/wiki/Www.wiktionary.org_template) ). When these pages are updated through the wiki, they must then be copied into this repository in order to be deployed. They are copied using the gulp command `gulp fetch-meta --portal wiktionary.org` to copy a single portal, or `gulp fetch-meta --portal all` to copy the newest versions of all the portal pages (except for wikipedia.org) into the repo.
