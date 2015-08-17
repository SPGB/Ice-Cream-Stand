# Libs
gulp        = require 'gulp'
uglify      = require 'gulp-uglify'
jsValidate  = require 'gulp-jsvalidate'
coffeelint  = require 'gulp-coffeelint'
awspublish  = require 'gulp-awspublish'
sass        = require 'gulp-sass'
imagemin    = require 'gulp-imagemin'
pngcrush    = require 'imagemin-pngcrush'
rename      = require "gulp-rename"
imageResize = require 'gulp-image-resize'
cache       = require 'gulp-cache'
jswrap      = require 'gulp-js-wrapper'
concat      = require 'gulp-concat'
ngAnnotate  = require 'gulp-ng-annotate'
prefix      = require 'gulp-autoprefixer'
gulpif      = require 'gulp-if'
coffee      = require 'gulp-coffee'
jade        = require 'gulp-jade'
config      = require './config.js'
# Paths
paths = {
  scripts: ['source/**/*.coffee', 'source/**/*.js']
  html: ['source/**/*.jade']
  css: ['source/css/*.scss']
  scripts_public: ['public/js/*.js']
  flavours: ['source/img/flavours/*.png']
  backgrounds: ['source/img/backgrounds/*.png']
  addons: ['source/img/addons/*.png']
  cones: ['source/img/cones/*.png']
  css_public: ['public/css/*.css']
  html_public: ['public/html/**/*.html']
  json: ['source/json/*.json']
}
headers_image = {
  'Cache-Control': 'max-age=315350000, no-transform, public',
  'Content-Type': 'image/png'
}
version = '152'

gulp.task 'clear', ->
  gulp.src(paths.addons)
    .pipe(cache.clear())
  cache.clearAll()

#Minify and copy all JavaScript (except vendor scripts)
gulp.task 'js', ->
  gulp.src(paths.scripts)
    .pipe gulpif /[.]coffee$/, coffee({bare: true})
    .pipe jsValidate()
    .pipe ngAnnotate()
    .pipe concat('main_' + version + '.js')
    #.pipe(uglify())
    #.pipe(jswrap({ }))
    .pipe gulp.dest('public/js')

gulp.task 'html', ->
  gulp.src(paths.html)
    .pipe jade()
    #.pipe(uglify())
    #.pipe(jswrap({ }))
    .pipe gulp.dest('public/html')


gulp.task 'css', ->
  gulp.src(paths.css)
    .pipe(sass())
    .pipe prefix "> 1%"
    .pipe(gulp.dest('public/css'))

gulp.task 'publish_js', ['js'], ->

  #create a new publisher
  publisher = awspublish.create(config.aws)

  #define custom headers
  headers = {
     'Cache-Control': 'max-age=315360000, no-transform, public',
     'Content-Type': 'text/javascript'
   }

  gulp.src paths.scripts_public

     #gzip, Set Content-Encoding headers and add .gz extension
    .pipe awspublish.gzip { ext: '.gz' }

    #publisher will add Content-Length, Content-Type and  headers specified above
    #If not specified it will set x-amz-acl to public-read by default
    .pipe publisher.publish(headers)

    #create a cache file to speed up consecutive uploads
    .pipe publisher.cache()

     #print upload updates to console
    .pipe awspublish.reporter()

gulp.task 'backgrounds', ->
  #create a new publisher
  publisher = awspublish.create config.aws

  gulp.src paths.backgrounds

    .pipe cache(imagemin({
            optimizationLevel: 2,
            use: [pngcrush()]
    }))
    .pipe rename((path) ->
      path.dirname += '/backgrounds'
    )
     #gzip, Set Content-Encoding headers and add .gz extension
    .pipe awspublish.gzip({ ext: '.gz' })

    #publisher will add Content-Length, Content-Type and  headers specified above
    #If not specified it will set x-amz-acl to public-read by default
    .pipe publisher.publish(headers_image)

    #create a cache file to speed up consecutive uploads
    .pipe publisher.cache()

     #print upload updates to console
    .pipe awspublish.reporter()

gulp.task 'flavours', ['publish_js', 'flavours_thumb'], ->
  #create a new publisher
  publisher = awspublish.create(config.aws)

  gulp.src paths.flavours

    .pipe cache(imagemin({
            optimizationLevel: 2,
            use: [pngcrush()]
    }))
    .pipe rename((path) ->
      path.dirname += '/flavours'
    )
     #gzip, Set Content-Encoding headers and add .gz extension
    .pipe awspublish.gzip({ ext: '.gz' })

    #publisher will add Content-Length, Content-Type and  headers specified above
    #If not specified it will set x-amz-acl to public-read by default
    .pipe publisher.publish(headers_image)

    #create a cache file to speed up consecutive uploads
    .pipe publisher.cache()

     #print upload updates to console
    .pipe awspublish.reporter()

gulp.task 'addons', ['publish_js', 'addons_thumb'], ->
  #create a new publisher
  publisher = awspublish.create(config.aws)

  gulp.src paths.addons

    .pipe cache(imagemin({
            optimizationLevel: 2,
            use: [pngcrush()]
    }))
    .pipe rename((path) ->
      path.dirname += '/addons'
    )
     #gzip, Set Content-Encoding headers and add .gz extension
    .pipe awspublish.gzip({ ext: '.gz' })

    #publisher will add Content-Length, Content-Type and  headers specified above
    #If not specified it will set x-amz-acl to public-read by default
    .pipe publisher.publish(headers_image)

    #create a cache file to speed up consecutive uploads
    .pipe publisher.cache()

     #print upload updates to console
    .pipe awspublish.reporter()


gulp.task 'addons_thumb', ->
  #create a new publisher
  publisher = awspublish.create(config.aws)

  gulp.src paths.addons
    .pipe imageResize({ 
      width : 100,
      height : 100,
      crop : false,
      gravity: 'South',
      imageMagick: true
    })
    .pipe cache(imagemin({
            optimizationLevel: 2,
            use: [pngcrush()]
    }))
    .pipe rename((path) ->
      path.dirname += '/addons/thumb'
    )
     #gzip, Set Content-Encoding headers and add .gz extension
    .pipe(awspublish.gzip({ ext: '.gz' }))

    #publisher will add Content-Length, Content-Type and  headers specified above
    #If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers_image))

    #create a cache file to speed up consecutive uploads
    .pipe(publisher.cache())

     #print upload updates to console
    .pipe(awspublish.reporter())


gulp.task 'flavours_thumb', ->
  #create a new publisher
  publisher = awspublish.create(config.aws)

  gulp.src paths.flavours
    .pipe imageResize({ 
      width : 100,
      height : 100,
      crop : false,
      gravity: 'South',
      imageMagick: true
    })
    .pipe imagemin({
      optimizationLevel: 2,
      use: [pngcrush()]
    })
    .pipe rename((path) ->
      path.dirname += '/flavours/thumb'
    )
     #gzip, Set Content-Encoding headers and add .gz extension
    .pipe(awspublish.gzip({ ext: '.gz' }))

    #publisher will add Content-Length, Content-Type and  headers specified above
    #If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers_image))

    #create a cache file to speed up consecutive uploads
    .pipe(publisher.cache())

     #print upload updates to console
    .pipe(awspublish.reporter())


gulp.task 'cones', ['publish_js', 'cones_thumb'], ->
  #create a new publisher
  publisher = awspublish.create(config.aws)

  gulp.src paths.cones

    .pipe imagemin({
      optimizationLevel: 2,
      use: [pngcrush()]
    })
    .pipe rename((path) ->
      path.dirname += '/cones'
    )
     #gzip, Set Content-Encoding headers and add .gz extension
    .pipe(awspublish.gzip({ ext: '.gz' }))

    #publisher will add Content-Length, Content-Type and  headers specified above
    #If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers_image))

    #create a cache file to speed up consecutive uploads
    .pipe(publisher.cache())

     #print upload updates to console
    .pipe(awspublish.reporter())


gulp.task 'cones_thumb', ->
  #create a new publisher
  publisher = awspublish.create(config.aws)

  gulp.src(paths.cones)
    .pipe imageResize({
      width : 100
      height : 100
      crop : false
      gravity: 'South'
      imageMagick: true
    })
    .pipe imagemin({
      optimizationLevel: 2
      use: [pngcrush()]
    })
    .pipe rename (path) ->
      path.dirname += '/cones/thumb'
    
     #gzip, Set Content-Encoding headers and add .gz extension
    .pipe awspublish.gzip({ ext: '.gz' })

    #publisher will add Content-Length, Content-Type and  headers specified above
    #If not specified it will set x-amz-acl to public-read by default
    .pipe publisher.publish(headers_image)

    #create a cache file to speed up consecutive uploads
    .pipe publisher.cache()

     #print upload updates to console
    .pipe awspublish.reporter()

gulp.task 'publish_css', ['css'], ->

  #create a new publisher
  publisher = awspublish.create(config.aws)

  #define custom headers
  headers = {
     'Cache-Control': 'max-age=315360000, no-transform, public',
     'Content-Type': 'text/css'
   }

  gulp.src(paths.css_public)

     #gzip, Set Content-Encoding headers and add .gz extension
    .pipe awspublish.gzip { ext: '.gz' }

    #publisher will add Content-Length, Content-Type and  headers specified above
    #If not specified it will set x-amz-acl to public-read by default
    .pipe publisher.publish headers 

    #create a cache file to speed up consecutive uploads
    .pipe publisher.cache()

     #print upload updates to console
    .pipe awspublish.reporter()

gulp.task 'publish_html', ['html'], ->

  #create a new publisher
  publisher = awspublish.create(config.aws)

  #define custom headers
  headers = {
     'Cache-Control': 'max-age=315360000, no-transform, public',
     'Content-Type': 'text/css'
   }

  gulp.src(paths.html_public)

     #gzip, Set Content-Encoding headers and add .gz extension
    .pipe awspublish.gzip { ext: '.gz' }

    #publisher will add Content-Length, Content-Type and  headers specified above
    #If not specified it will set x-amz-acl to public-read by default
    .pipe publisher.publish headers 

    #create a cache file to speed up consecutive uploads
    .pipe publisher.cache()

     #print upload updates to console
    .pipe awspublish.reporter()

gulp.task 'publish_json', ->

  #create a new publisher
  publisher = awspublish.create config.aws 

  #define custom headers
  headers = {
     'Cache-Control': 'max-age=315360000, no-transform, public',
     'Content-Type': 'application/json'
   }

  gulp.src paths.json 

     #gzip, Set Content-Encoding headers and add .gz extension
    .pipe awspublish.gzip { ext: '.gz' }

    #publisher will add Content-Length, Content-Type and  headers specified above
    #If not specified it will set x-amz-acl to public-read by default
    .pipe publisher.publish headers

    #create a cache file to speed up consecutive uploads
    .pipe publisher.cache()

     #print upload updates to console
    .pipe awspublish.reporter()

#Rerun the task when a file changes
gulp.task 'watch', ->
    gulp.watch paths.scripts, ['publish_js']
    gulp.watch paths.css, ['publish_css']

#The default task (called when you run `gulp` from cli)
gulp.task 'default', ['publish_html', 'publish_js', 'publish_css', 'publish_json']
