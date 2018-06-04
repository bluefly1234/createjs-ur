'use strict'

const gulp = require('gulp')
const autoprefixer = require('gulp-autoprefixer')
const sass = require('gulp-sass')
const cleanCSS = require('gulp-clean-css')
const sourcemaps = require('gulp-sourcemaps')
const plumber = require('gulp-plumber')
// const eslint = require('gulp-eslint')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const inlinesource = require('gulp-inline-source')
const browserSync = require('browser-sync').create()
const runSequence = require('run-sequence')
const del = require('del')
const purifycss = require('gulp-purifycss')

const config = require('./gulpfile.config.js')

gulp.task('html', function () {
  return gulp.src(config.html.src)
    .pipe(gulp.dest(config.html.dest))
    .pipe(browserSync.reload({ stream: true }))
})

gulp.task('css', function () {
  return gulp.src(config.css.src)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(autoprefixer({
      browsers: ['iOS >= 7', 'Android >= 4', '> 1%', 'last 2 version']
    }))
    // .pipe(cleanCSS())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(config.css.dest))
    .pipe(browserSync.reload({ stream: true }))
})

gulp.task('sass', function () {
  return gulp.src(config.sass.src)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['iOS >= 7', 'Android >= 4', '> 1%', 'last 2 version']
    }))
    // .pipe(cleanCSS())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(config.sass.dest))
    .pipe(browserSync.reload({ stream: true }))
})

gulp.task('image', function () {
  return gulp.src(config.image.src)
    .pipe(plumber())
    .pipe(gulp.dest(config.image.dest))
    .pipe(browserSync.reload({ stream: true }))
})

gulp.task('js', function () {
  return gulp.src(config.js.src)
    .pipe(plumber())
    // .pipe(eslint())
    // .pipe(eslint.format())
    // .pipe(eslint.failAfterError())
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(config.js.dest))
    .pipe(browserSync.reload({ stream: true }))
})

gulp.task('lib', function () {
  return gulp.src(config.lib.src)
    .pipe(gulp.dest(config.lib.dest))
    .pipe(browserSync.reload({ stream: true }))
})

gulp.task('clean', function () {
  return del([config.dest])
})

// gulp.task('build', ['html', 'css', 'sass', 'image', 'js', 'lib']);
gulp.task('build', function (callback) {
  runSequence('clean', ['html', 'css', 'sass', 'image', 'js', 'lib'], callback)
})

gulp.task('watch', function () {
  gulp.watch(config.html.src, ['html'])
  gulp.watch(config.css.src, ['css'])
  gulp.watch(config.sass.src, ['sass'])
  gulp.watch(config.image.src, ['image'])
  gulp.watch(config.js.src, ['js'])
  gulp.watch(config.lib.src, ['lib'])
})

gulp.task('server', ['build', 'watch'], function () {
  browserSync.init({
    server: {
      baseDir: config.dest
    },
    // 停止自动打开浏览器
    open: false,
    host: 'xiandean.gd.sina.com.cn'
    // browser: "chrome"
    // browser: ["chrome", "firefox"]
  })
})

gulp.task('cssmin', function () {
  return gulp.src(config.css.dest + '/*.css')
    .pipe(purifycss([
      config.html.dest + '/*.html',
      config.js.dest + '/*.js'
    ]))
    .pipe(cleanCSS())
    .pipe(gulp.dest(config.css.dest))
})
gulp.task('jsmin', function () {
  return gulp.src(config.js.dest + '/*.js')
    .pipe(uglify())
    .pipe(gulp.dest(config.js.dest))
})
gulp.task('inlinesource', function () {
  return gulp.src(config.html.dest + '/*.html')
    .pipe(inlinesource({
      compress: true,
      pretty: true
    }))
    .pipe(gulp.dest(config.html.dest))
})
gulp.task('prod', ['build'], function (callback) {
  runSequence('jsmin', 'cssmin', 'inlinesource', callback)
})

gulp.task('default', ['server'])
