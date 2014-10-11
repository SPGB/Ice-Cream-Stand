var gulp = require('gulp');
var uglify = require('gulp-uglify');
var jsValidate = require('gulp-jsvalidate');
var awspublish = require('gulp-awspublish');
var sass = require('gulp-sass');

var config = require('./config.js');
var paths = {
  scripts: ['source/js/*.js'],
  css: ['source/css/*.scss'],
  scripts_public: ['public/js/*.js'],
  css_public: ['public/css/*.css'],
  json: ['source/json/*.json'],
};

gulp.task('js', function() {
  // Minify and copy all JavaScript (except vendor scripts)
  return gulp.src(paths.scripts)
    .pipe(jsValidate())
    .pipe(uglify())
    .pipe(gulp.dest('public/js'));
});
gulp.task('css', function () {
    return gulp.src(paths.css)
        .pipe(sass())
        .pipe(gulp.dest('public/css'));
});
gulp.task('publish_js', ['js'], function() {

  // create a new publisher
  var publisher = awspublish.create(config.aws);

  // define custom headers
  var headers = {
     'Cache-Control': 'max-age=315360000, no-transform, public',
     'Content-Type': 'text/javascript'
   };

  return gulp.src(paths.scripts_public)

     // gzip, Set Content-Encoding headers and add .gz extension
    .pipe(awspublish.gzip({ ext: '.gz' }))

    // publisher will add Content-Length, Content-Type and  headers specified above
    // If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers))

    // create a cache file to speed up consecutive uploads
    .pipe(publisher.cache())

     // print upload updates to console
    .pipe(awspublish.reporter());
});

gulp.task('publish_css', ['css'], function() {

  // create a new publisher
  var publisher = awspublish.create(config.aws);

  // define custom headers
  var headers = {
     'Cache-Control': 'max-age=315360000, no-transform, public',
     'Content-Type': 'text/css'
   };

  return gulp.src(paths.css_public)

     // gzip, Set Content-Encoding headers and add .gz extension
    .pipe(awspublish.gzip({ ext: '.gz' }))

    // publisher will add Content-Length, Content-Type and  headers specified above
    // If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers))

    // create a cache file to speed up consecutive uploads
    .pipe(publisher.cache())

     // print upload updates to console
    .pipe(awspublish.reporter());
});

gulp.task('publish_json', function() {

  // create a new publisher
  var publisher = awspublish.create(config.aws);

  // define custom headers
  var headers = {
     'Cache-Control': 'max-age=315360000, no-transform, public',
     'Content-Type': 'application/json'
   };

  return gulp.src(paths.json)

     // gzip, Set Content-Encoding headers and add .gz extension
    .pipe(awspublish.gzip({ ext: '.gz' }))

    // publisher will add Content-Length, Content-Type and  headers specified above
    // If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers))

    // create a cache file to speed up consecutive uploads
    .pipe(publisher.cache())

     // print upload updates to console
    .pipe(awspublish.reporter());
});

// Rerun the task when a file changes
gulp.task('watch', function() {
    gulp.watch(paths.scripts, ['publish_js'])
    gulp.watch(paths.css, ['publish_css']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['publish_js', 'publish_css', 'publish_json']);
