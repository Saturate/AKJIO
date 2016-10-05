'use strict';

const gulp = require('gulp');
const debug = require('gulp-debug');
const del = require('del');
const water = require('gulp-water');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');

const config = {
	dist: './dist'
};

function preview() {
	browserSync.init({
		server: {
			baseDir: config.dist
		}
	});
}

function generate() {
	return gulp.src('./content/**/*.md')
		.pipe(debug({title: 'Pipe to water:'}))
		.pipe(water())
		.pipe(debug({title: 'Dist:'}))
		.pipe(gulp.dest(config.dist));
}

function styles() {
	return gulp.src('./app/styles/**/*.scss')
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(config.dist + '/styles'));
}


function clean() {
	return del([ config.dist ]);
}

// Task Metadata
preview.description = 'Starts a browser-sync server with the generated site.';
generate.description = 'Generate static site with water.';
generate.clean = 'Clean\'s everything up neat and tidy.';

// Public Tasks
exports.preview = preview;
exports.generate = generate;
exports.clean = clean;

gulp.task('default', gulp.series(clean, generate, styles));
