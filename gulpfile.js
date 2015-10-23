
var gulp = require('gulp'),
    gulpLoadPlugins = require('gulp-load-plugins');

var plugins = gulpLoadPlugins();

var baseDir = "dev/wikipedia.org/";
var prodDir = "prod/wikipedia.org/";

gulp.task('inline-assets', function(){
  gulp.src(baseDir+"index.html")
      .pipe(plugins.inline({
        base: baseDir,
        js: plugins.uglify,
        css: plugins.minifyCss,
        disabledTypes: ["svg", "img"]
      }))
      .pipe(gulp.dest(prodDir));
});

gulp.task('default', ['inline-assets']);