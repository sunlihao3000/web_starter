var $      = require('gulp-load-plugins')();
var argv   = require('yargs').argv;
var browser = require('browser-sync');
var gulp   = require('gulp');
var rimraf = require('rimraf');
var panini = require('panini');
var sequence = require('run-sequence');


// Check for --production flag
var isProduction = !!(argv.production);

// Port to use for the development server.
var PORT = 8001;

// Browsers to target when prefixing CSS.
var COMPATIBILITY = ['last 2 versions', 'ie >= 9'];

// File paths to various assets are defined here.
var PATHS = {
  assets: [
    'src/assets/**/*',
    '!src/assets/{!img,js,scss}/**/*',
    //'!src/assets/{!img,js}/**/*'
  ],
  assetsBuild: [
    'src/assets/**/*',
    '!src/assets/{!img,js}/**/*'
  ],
  // sass: [
  //   'src/assets/scss/'
  // ],
  sassPlugins: [
    'src/assets/scss/plugins/'
  ], 
  sassMain: [
    'src/assets/scss/main/'
  ], 
  javascriptHead: [
    //'src/assets/js/**/*.js',
    'src/assets/js/head/*.js'
  ],
  javascript: [
    // ='bower_components/jquery/dist/jquery.min.js',
    'src/assets/js/jquery.min.js',
    'src/assets/js/plugins.js',
    'src/assets/js/app.js'
  ]
};

// Delete the "dist" folder
// This happens every time a build starts
gulp.task('clean', function(done) {
  rimraf('./dist', done);
});

// Copy files out of the assets folder
// This task skips over the "img", "js", and "scss" folders, which are parsed separately
gulp.task('copy', function() {
    //gulp.src(PATHS.assets)
    return gulp.src(!!(argv.production) ? PATHS.assetsBuild : PATHS.assets)
    .pipe(gulp.dest('./dist/assets'));
});

gulp.task('copyBuild', function() {
    gulp.src(PATHS.assetsBuild)
    .pipe(gulp.dest('./dist/assets'));
});


// Copy page templates into finished HTML files
gulp.task('pages', function() {
  gulp.src('./src/pages/**/*.{html,hbs,handlebars}')
    .pipe(panini({
      root: './src/pages/',
      layouts: './src/layouts/',
      partials: './src/partials/',
      data: './src/data/',
      helpers: './src/helpers/'
    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('pages:reset', function() {
  panini.refresh();
  gulp.start('pages');  
  browser.reload();
});

// Compile plugins Sass into CSS
//the CSS is compressed
gulp.task('sassPlugins', function() {

  var minifycss = $.minifyCss();

  return gulp.src('./src/assets/scss/plugins/plugins.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      includePaths: PATHS.sassPlugins
    })
      .on('error', $.sass.logError))
      .pipe($.autoprefixer({
      browsers: COMPATIBILITY
    }))
    //.pipe(uncss)
    .pipe(minifycss)
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('./dist/assets/css'));
});

// Compile plugins Sass into CSS
//the CSS is compressed
gulp.task('sassMain', function() {

  var minifycss = $.if(isProduction, $.minifyCss());

  return gulp.src('./src/assets/scss/main/main.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      includePaths: PATHS.sassMain
    })
      .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: COMPATIBILITY
    }))
    //.pipe(uncss)
    .pipe(minifycss)
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('./dist/assets/css'));
});

// 
// 
gulp.task('javascriptHead', function() {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));
  return gulp.src(PATHS.javascriptHead)
    .pipe($.sourcemaps.init())
    .pipe($.concat('stack.js'))
    .pipe(uglify)
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('./dist/assets/js'));
});

// Combine JavaScript into one file
// In production, the file is minified
gulp.task('javascript', function() {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));

  return gulp.src(PATHS.javascript)
    .pipe($.sourcemaps.init())
    .pipe($.concat('app.js'))
    .pipe(uglify)
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('./dist/assets/js'));
});

// Copy images to the "dist" folder
// In production, the images are compressed
gulp.task('images', function() {
  var imagemin = $.if(isProduction, $.imagemin({
    progressive: true
  }));

  return gulp.src('./src/assets/img/**/*')
    .pipe(imagemin)
    .pipe(gulp.dest('./dist/assets/img'));
});

// Build the "dist" folder by running all of the above tasks
//
gulp.task('build', function(done) {
  sequence('clean', ['pages','sassPlugins', 'sassMain','javascript', 'javascriptHead', 'images', 'copy'], done);
});

// Start a server with LiveReload to preview the site in
gulp.task('server', ['build'], function() {
  browser.init({
    server: './dist', port: PORT
  });
});

// Build the site, run the server, and watch for file changes
gulp.task('default', ['build', 'server'], function() {
  gulp.watch(PATHS.assets, ['copy', browser.reload]);
  //gulp.watch(['./src/pages/**/*.html'], ['pages', browser.reload]);
  gulp.watch(['./src/{layouts,pages,partials}/**/*.html'], ['pages:reset']);
  gulp.watch(['./src/assets/scss/*.scss'], ['sassMain', browser.reload]);
  gulp.watch(['./src/assets/scss/*.scss'], ['sassPlugins', browser.reload]);
  gulp.watch(['./src/assets/scss/plugins/**/*.scss'], ['sassPlugins', browser.reload]);
  gulp.watch(['./src/assets/scss/main/**/*.scss'], ['sassMain', browser.reload]);
  gulp.watch(['./src/assets/js/*.js'], ['javascript', browser.reload]);
  gulp.watch(['./src/assets/js/head/*.js'], ['javascriptHead', browser.reload]);
  gulp.watch(['./src/assets/img/**/*'], ['images', browser.reload]);

});
