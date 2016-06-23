'use strict';

const gulp = require('gulp');
const debug = require('gulp-debug');
const del = require('del');
const water = require('./water.js');


function generate() {
	return gulp.src('content/**/*.md')
		.pipe(debug({title: 'Src to water:'}))
		.pipe(water())
		.pipe(debug({title: 'Dist:'}))
		.pipe(gulp.dest('test-dist'));
}

function clean() {
	return del([ 'test-dist' ]);
}

exports.generate = generate;
exports.clean = clean;

gulp.task('default', gulp.series(clean, generate));
