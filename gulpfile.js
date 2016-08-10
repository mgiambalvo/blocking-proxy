'use strict';

var gulp = require('gulp');
var clangFormat = require('clang-format');
var gulpFormat = require('gulp-clang-format');
var runSequence = require('run-sequence');
var spawn = require('child_process').spawn;

var runSpawn = function(done, task, opt_arg) {
  var child = spawn(task, opt_arg, {stdio: 'inherit'});
  child.on('close', function() {
    done();
  });
};

gulp.task('built:copy', function() {
  return gulp.src(['lib/**/*','!lib/**/*.ts'])
      .pipe(gulp.dest('built/lib/'));
});

gulp.task('webdriver:update', function(done) {
  runSpawn(done, 'bin/webdriver-manager', ['update']);
});

gulp.task('jslint', function(done) {
  runSpawn(done, './node_modules/.bin/jshint', ['lib', 'spec']);
});

gulp.task('clang-check', function() {
  return gulp.src(['src/**/*.ts'])
      .pipe(gulpFormat.checkFormat('file', clangFormat))
      .on('warning', function(e) {
    console.log(e);
  });
});

gulp.task('clang', function() {
  return gulp.src(['src/**/*.ts'])
      .pipe(gulpFormat.format('file', clangFormat))
      .on('warning', function(e) {
    console.log(e);
  });
});

gulp.task('typings', function(done) {
  runSpawn(done, 'node_modules/.bin/typings', ['install']);
});

gulp.task('tsc', function(done) {
  runSpawn(done, 'node', ['node_modules/typescript/bin/tsc']);
});

gulp.task('prepublish', function(done) {
  runSequence(['typings', 'jslint', 'clang'],'tsc', 'built:copy', done);
});

gulp.task('pretest', function(done) {
  runSequence(
    ['webdriver:update', 'typings', 'jslint', 'clang'], 'tsc', 'built:copy', done);
});

gulp.task('default', ['prepublish']);
gulp.task('build', ['prepublish']);

gulp.task('test:copy', function(done) {
  return gulp.src(['spec/**/*','!spec/**/*.ts'])
      .pipe(gulp.dest('built/spec/'));
});

gulp.task('test', ['build', 'test:copy'], function(done) {
  var opt_arg = [];
  opt_arg.push('node_modules/jasmine/bin/jasmine.js');
  opt_arg.push('JASMINE_CONFIG_PATH=spec/unit_config.json');
  runSpawn(done, 'node', opt_arg);
});

gulp.task('test:e2e', ['build', 'test:copy'], function(done) {
  var opt_arg = [];
  opt_arg.push('node_modules/jasmine/bin/jasmine.js');
  opt_arg.push('JASMINE_CONFIG_PATH=spec/e2e_config.json');
  runSpawn(done, 'node', opt_arg);
});
