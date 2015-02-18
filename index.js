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
var notify = require('gulp-notify');
var plumber = require('gulp-notify');

// gulp helpers
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var prettyHrtime = require('pretty-hrtime');

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
    outDir: './public'
  });

  var bundler = browserify(options.entry, watchify.args)
    .transform(sassify, {global: true, minify: options.devMode ? false : {}})
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
      .on('error', error)
      .pipe(source(options.outFile))
      .pipe(buffer());

    if (options.devMode) {
      bundleStream
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(options.outDir))
        .on('end', end)
        .pipe(livereload());
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

  function error() {
    var args = Array.prototype.slice.call(arguments);

    // Send error to notification center with gulp-notify
    notify.onError({
      title: "Compile Error",
      message: "<%= error %>"
    }).apply(this, args);

    // Keep gulp from hanging on this task
    this.emit('end');
  }

  return bundle;
}

