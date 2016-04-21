'use strict';

var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    sass = require('gulp-sass'),
    maps = require('gulp-sourcemaps');

gulp.task('concatScripts', function () {
    return gulp.src([
            'src/js/head.js',
            'src/js/utils.js',
            'src/js/core.js',
            'src/js/chart.js',
            'src/js/sort.js',
            'src/js/redraw.js',
            'src/js/tail.js'
        ])
        .pipe(maps.init())
        .pipe(concat('d3c.js'))
        .pipe(gulp.dest('dist'))
        .pipe(maps.write('./'))
        .pipe(gulp.dest('src/js'));
});

gulp.task('minifyScripts', ['concatScripts'], function () {
    return gulp.src('src/js/d3c.js')
        .pipe(uglify())
        .pipe(rename('d3c.min.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('compileSass', function () {
    return gulp.src('scss/application.scss')
        .pipe(maps.init())
        .pipe(sass())
        .pipe(maps.write('./'))
        .pipe(gulp.dest('dist'));
});

gulp.task('watchSass', function () {
    gulp.watch('src/scss/**/*.scss', ['compileSass']);
});

gulp.task('watchJs', function () {
    gulp.watch('src/js/**/*.js', ['minifyScripts']);
});

gulp.task('build', ['minifyScripts', 'compileSass']);

gulp.task('default', ['build', 'watchJs']);



