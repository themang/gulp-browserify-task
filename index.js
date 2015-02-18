/**
 * Moudles
 */

var browserify = require('browserify');
var watchify = require('watchify');

//transforms
var debowerify = require('debowerify');
var dehtmlify = require('dehtmlify');
var sassify = require('desassify');

//helpers
var _ = require('lodash');


// gulp
var gulp = require('gulp');
var gutil = require('gulp-util');
var livereload = require('gulp-livereload');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var errorHandler = require('gulp-error-handler')('Browserify Error');

// gulp helpers
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var prettyHrtime = require('pretty-hrtime');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

/**
 * Exports
 */

module.exports = browserifyTask;


/**
 * Browserify components task
 * 
 * @return {function} gulp task 
 */
function browserifyTask(options) {

  options = _.defaults(options || {}, {
    entry: './client.js', 
    outFile: 'build.js',
    outDir: './public',
    devMode: true
  });



  var bundler = browserify(options.entry, watchify.args)
    .transform(sassify, {global: true, minify: options.devMode ? false : (options.minifyCSS || {}), rewriteUrl: rewriteUrl})
    .transform(debowerify, {global: true})
    .transform(dehtmlify, {global: true});

  if (options.devMode) {
    gutil.log('Watching files required by', gutil.colors.yellow(options.entry))
    bundler = watchify(bundler)
    .on('update', bundle);
  }

  var startTime
  function bundle() {
    startTime = process.hrtime();
    gutil.log('Bundling', gutil.colors.green(options.entry) + '...');
    var bundleStream = bundler.bundle()
      .on('error', errorHandler)
      .pipe(source(options.outFile))
      .pipe(buffer());

    if (options.devMode) {
      bundleStream
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(options.outDir))
        .pipe(livereload())
        .on('end', end);
    } else {
      bundleStream
        .pipe(uglify({mangle: false}))
        .pipe(gulp.dest(options.outDir))
        .on('end', end);
    }


    return bundleStream;
  }

  function end() {
    var taskTime = process.hrtime(startTime);
    var prettyTime = prettyHrtime(taskTime);
    gutil.log('Bundled',gutil.colors.green(options.entry), 'to', gutil.colors.green(options.outFile), 'in', gutil.colors.magenta(prettyTime));
  }

  function rewriteUrl(url, filePath) {
    if (url.indexOf('http://') == 0)
      return url;
    else if(url[0] !== '/') {
      url = path.relative(process.cwd(), path.join(path.dirname(filePath), url));
      if (url.indexOf('node_modules') === 0)
        url = url.slice('node_modules'.length);
    }
    url = url.slice(1);
    var data = fs.readFileSync(url);
    mkdirp.sync(options.outDir + '/' + path.dirname(url));
    fs.writeFileSync(options.outDir + '/' + url, data);
    return url;

  }

  return bundle;
}

