var gulp = require('gulp');
var uglify = require('gulp-uglify');
var jsValidate = require('gulp-jsvalidate');
var awspublish = require('gulp-awspublish');
var sass = require('gulp-sass');
var imagemin = require('gulp-imagemin');
var pngcrush = require('imagemin-pngcrush');
var rename = require("gulp-rename");
var imageResize = require('gulp-image-resize');
var cache = require('gulp-cache');
var jswrap = require('gulp-js-wrapper');
var concat = require('gulp-concat');
var ngAnnotate = require('gulp-ng-annotate');

var config = require('./config.js');
var paths = {
  scripts: ['source/js/*.js'],
  css: ['source/css/*.scss'],
  scripts_public: ['public/js/*.js'],
  flavours: ['source/img/flavours/*.png'],
  backgrounds: ['source/img/backgrounds/*.png'],
  addons: ['source/img/addons/*.png'],
  cones: ['source/img/cones/*.png'],
  css_public: ['public/css/*.css'],
  json: ['source/json/*.json'],
};
var headers_image = {
  'Cache-Control': 'max-age=315350000, no-transform, public',
  'Content-Type': 'image/png'
};
var version = '150';

gulp.task('js', function() {
  // Minify and copy all JavaScript (except vendor scripts)
  return gulp.src(paths.scripts)
    .pipe(jsValidate())
    .pipe(ngAnnotate())
    .pipe(concat('main_' + version + '.js'))
    //.pipe(uglify())
    //.pipe(jswrap({ }))
    .pipe(gulp.dest('public/js'));
});
gulp.task('clear', function() {
  // Still pass the files to clear cache for
  gulp.src(paths.addons)
    .pipe(cache.clear());

  // Or, just call this for everything
  cache.clearAll();
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
gulp.task('backgrounds', function() {
  // create a new publisher
  var publisher = awspublish.create(config.aws);

  // define custom headers
  

  return gulp.src(paths.backgrounds)

    .pipe(cache(imagemin({
            optimizationLevel: 2,
            use: [pngcrush()]
    })))
    .pipe(rename(function (path) {
      path.dirname += '/backgrounds';
    }))
     // gzip, Set Content-Encoding headers and add .gz extension
    .pipe(awspublish.gzip({ ext: '.gz' }))

    // publisher will add Content-Length, Content-Type and  headers specified above
    // If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers_image))

    // create a cache file to speed up consecutive uploads
    .pipe(publisher.cache())

     // print upload updates to console
    .pipe(awspublish.reporter());
});
gulp.task('flavours', ['publish_js', 'flavours_thumb'], function() {
  // create a new publisher
  var publisher = awspublish.create(config.aws);

  // define custom headers
  

  return gulp.src(paths.flavours)

    .pipe(cache(imagemin({
            optimizationLevel: 2,
            use: [pngcrush()]
    })))
    .pipe(rename(function (path) {
      path.dirname += '/flavours';
    }))
     // gzip, Set Content-Encoding headers and add .gz extension
    .pipe(awspublish.gzip({ ext: '.gz' }))

    // publisher will add Content-Length, Content-Type and  headers specified above
    // If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers_image))

    // create a cache file to speed up consecutive uploads
    .pipe(publisher.cache())

     // print upload updates to console
    .pipe(awspublish.reporter());
});
gulp.task('addons', ['publish_js', 'addons_thumb'], function() {
  // create a new publisher
  var publisher = awspublish.create(config.aws);

  // define custom headers
  

  return gulp.src(paths.addons)

    .pipe(cache(imagemin({
            optimizationLevel: 2,
            use: [pngcrush()]
    })))
    .pipe(rename(function (path) {
      path.dirname += '/addons';
    }))
     // gzip, Set Content-Encoding headers and add .gz extension
    .pipe(awspublish.gzip({ ext: '.gz' }))

    // publisher will add Content-Length, Content-Type and  headers specified above
    // If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers_image))

    // create a cache file to speed up consecutive uploads
    .pipe(publisher.cache())

     // print upload updates to console
    .pipe(awspublish.reporter());
});
gulp.task('addons_thumb', function() {
  // create a new publisher
  var publisher = awspublish.create(config.aws);


  return gulp.src(paths.addons)
    .pipe(imageResize({ 
      width : 100,
      height : 100,
      crop : false,
      gravity: 'South',
      imageMagick: true
    }))
    .pipe(cache(imagemin({
            optimizationLevel: 2,
            use: [pngcrush()]
    })))
    .pipe(rename(function (path) {
      path.dirname += '/addons/thumb';
    }))
     // gzip, Set Content-Encoding headers and add .gz extension
    .pipe(awspublish.gzip({ ext: '.gz' }))

    // publisher will add Content-Length, Content-Type and  headers specified above
    // If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers_image))

    // create a cache file to speed up consecutive uploads
    .pipe(publisher.cache())

     // print upload updates to console
    .pipe(awspublish.reporter());
});
gulp.task('flavours_thumb', function() {
  // create a new publisher
  var publisher = awspublish.create(config.aws);


  return gulp.src(paths.flavours)
    .pipe(imageResize({ 
      width : 100,
      height : 100,
      crop : false,
      gravity: 'South',
      imageMagick: true
    }))
    .pipe(imagemin({
            optimizationLevel: 2,
            use: [pngcrush()]
    }))
    .pipe(rename(function (path) {
      path.dirname += '/flavours/thumb';
    }))
     // gzip, Set Content-Encoding headers and add .gz extension
    .pipe(awspublish.gzip({ ext: '.gz' }))

    // publisher will add Content-Length, Content-Type and  headers specified above
    // If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers_image))

    // create a cache file to speed up consecutive uploads
    .pipe(publisher.cache())

     // print upload updates to console
    .pipe(awspublish.reporter());
});
gulp.task('cones', ['publish_js', 'cones_thumb'], function() {
  // create a new publisher
  var publisher = awspublish.create(config.aws);

  // define custom headers
  

  return gulp.src(paths.cones)

    .pipe(imagemin({
            optimizationLevel: 2,
            use: [pngcrush()]
    }))
    .pipe(rename(function (path) {
      path.dirname += '/cones';
    }))
     // gzip, Set Content-Encoding headers and add .gz extension
    .pipe(awspublish.gzip({ ext: '.gz' }))

    // publisher will add Content-Length, Content-Type and  headers specified above
    // If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers_image))

    // create a cache file to speed up consecutive uploads
    .pipe(publisher.cache())

     // print upload updates to console
    .pipe(awspublish.reporter());
});
gulp.task('cones_thumb', function() {
  // create a new publisher
  var publisher = awspublish.create(config.aws);


  return gulp.src(paths.cones)
    .pipe(imageResize({ 
      width : 100,
      height : 100,
      crop : false,
      gravity: 'South',
      imageMagick: true
    }))
    .pipe(imagemin({
            optimizationLevel: 2,
            use: [pngcrush()]
    }))
    .pipe(rename(function (path) {
      path.dirname += '/cones/thumb';
    }))
     // gzip, Set Content-Encoding headers and add .gz extension
    .pipe(awspublish.gzip({ ext: '.gz' }))

    // publisher will add Content-Length, Content-Type and  headers specified above
    // If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers_image))

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
