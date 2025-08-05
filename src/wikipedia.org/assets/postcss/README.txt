==============
PostCSS Guide
==============
The files in the directory are processed by PostCSS.

Files that begin with an underscore
-----------------------------------
These files are treated as 'partials'. They should be
included in 'main' file, here 'style.css', using `@import` statements.
PostCSS-import will expand the `@import` statements
and merge these files into the main file.

Files that don't begin with an underscore
-----------------------------------------
These are the 'main' files. They are processed by PostCSS
and output into the CSS folder. These files can then
be referenced in the HTML file with `<link rel="stylesheet">` tags.

Special files
-------------
_vars.css - is reserved for CSS variables (CSS custom properties).

=====================
PostCSS Plugins Used:
=====================

CSSNext
  http://cssnext.io/
  offers CSS custom properties and a range of future CSS standard features
  as well as vendor prefixes (`-webkit-`, `-moz-`, `-ms-`, `-o-`) where
  necessary.

PostCSS-Import
  https://github.com/postcss/postcss-import
  Inlines CSS `@import` statements.
