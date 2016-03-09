==============
Post CSS Guide
==============
The files in the directory are processed by postCSS.

Files that begin with an underscore
-----------------------------------
These files are treated as 'partials'.They should be
included in 'main' files using @import statements.
PostCSS-import will expand the @import statements
and merge these files into the main file.

Files that don't begin with an underscore
-----------------------------------------
These are the 'Main' files. They are process by PostCSS
and output into the css folder. These files can then
be referenced in the HTML file with <link rel='stylesheet> tags.

Special files
-------------
_vars.css - is reserved for css variables (css custom properties).
_ie.css - reserved for IE6 and IE7 specific styles.

=====================
PostCSS Plugins Used:
=====================

CSSNext
  http://cssnext.io/
  offers css custom properties and a range of future css standard features.

PostCSS-Import
  https://github.com/postcss/postcss-import
  Inlines CSS @import statements.


PostCSS-CSSSimple
  https://www.npmjs.com/package/postcss-csssimple
  Fixes IE6-8 bugs, like adding _zoom:1 to display:inline-block.

Autoprefixer
  https://github.com/postcss/autoprefixer
  Adds vendor prefixes (-webkit-, -moz-, -ms, -o-) where necessary.