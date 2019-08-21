var gulp = require('gulp');
var usemin = require('gulp-usemin');
var minify = require('gulp-minify');
var del = require('del');
var rev = require('gulp-rev');
var htmlmin = require('gulp-htmlmin');
var connect = require('gulp-connect');
var templateCache = require('gulp-angular-templatecache');

/* Task use while in dev*/

// gulp.task('default', ['connect','create-template']);
// gulp.task('create-template', [], function() {
//     // watch for HTML changes
//     gulp.watch(['app/ui/views/*.html', 'app/!**!/!**/!*.js'], function() {
//         console.log('rebuilding & reloading');
//         templating().pipe(connect.reload());
//     });
// });



gulp.task('clean', function () {
    return del(['build']);
});

gulp.task('copy-config', function () {
    return gulp.src('./web.config')
        .pipe(gulp.dest('./build/'));
});

gulp.task('copy-app', ['copy-assets','copy-config'], function () {
    return gulp.src('./app/**/*')
        .pipe(gulp.dest('./build/app/'));
});

gulp.task('copy-assets', ['clean'], function () {
    return gulp.src('./assets/**/*')
        .pipe(gulp.dest('./build/assets/'));
});

gulp.task('default', ['minify-modules'], function () {
    return gulp.src('./index.html')
        .pipe(usemin({
            html: [htmlmin({ collapseWhitespace: true, minifyJS: true, minifyCSS: true, removeComments: true })],
            css: [minify({ noSource: true, mangle: true }), rev],
            js1: [minify({ noSource: true, mangle: true }), rev],
            js2: [minify({ noSource: true, mangle: true }), rev],
            lib: [minify({ noSource: true, mangle: true }), rev],
            lib1: [minify({ noSource: true, mangle: true }), rev],
            enableHtmlComment: false
        }))
        .pipe(gulp.dest('./build/'));
});

gulp.task('minify-modules', ['templating'], function () {
    return gulp.src('./assets/modules/*')
        .pipe(minify({ noSource: true, mangle: true, ext :{min:".js"} }))
        .pipe(gulp.dest('./build/assets/modules/'));
});

gulp.task('templating', ['copy-app', 'copy-assets'], templating, function(err){
    console.log(err);
});

gulp.task('connect', function () {
    return connect.server({
        port: 8010,
        livereload: true
    });
});


function templating() {
    var header = 'angular.module("SurveyEngine", []);(function (angular) {"use strict"; angular.module("SurveyEngine").run(["$templateCache", function($templateCache) {';
    var footer = '}])})(angular);';
    del.sync('./app/ui/app.module.js');
    return gulp.src('./app/ui/views/*.html')
        .pipe(templateCache({templateHeader : header, templateFooter :footer, filename : 'app.module.js'}))
        .pipe(gulp.dest('./app/ui/'));
}
