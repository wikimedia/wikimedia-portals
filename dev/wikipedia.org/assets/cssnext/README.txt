The files in the directory are processed by cssnext.
style.css is the 'main' file. All other files are
treated as 'partials' that should be included in style.css
via @import statements. PostCSS-import will expand the @import
statements and merge these files in style.css.

All other files should be treated as 'partials' and
should begin with an underscore.

_vars.css is reserved for css variables (css custom properties).