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
		open: false, // TODO: Use args from commandline?
		server: {
			baseDir: config.dist
		}
	});
}

function watch() {
	let watcher = gulp.watch('dist/**/*.html', browserSync.reload);
	let contentWatcher = gulp.watch('content/**/*.md', gulp.series(generate));
	let appWatcher = gulp.watch('./app/**/*.{html}', gulp.series(generate));

	contentWatcher.on('change', function(path) {
		console.log('File ' + path + ' was removed');
	});

	appWatcher.on('change', function(path) {
		console.log('File ' + path + ' was removed');
	});

	//watcher.on('change', browserSync.reload);

	return watcher;
}

function generate() {
	return new water({ content: './content/**/*.md' })
		.pipe(debug({title: 'Piped from water module:'}))
		.pipe(gulp.dest(config.dist))
		.pipe(browserSync.stream());
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

var dev = gulp.series(generate, gulp.parallel(preview, watch));
var build = gulp.series(clean, generate, styles);

// Task Metadata
preview.description = 'Starts a browser-sync server with the generated site.';
generate.description = 'Generate static site with water.';
clean.description = 'Clean\'s everything up neat and tidy.';
dev.description = 'Start up a local server, watch files and run generate on change.';

// Public Tasks
exports.preview = preview;
exports.dev = dev;
exports.generate = generate;
exports.clean = clean;
exports.build = build;

gulp.task('default', build);
