'use strict';

var settings = {
	port: 9077
}

// Standing on the shoulders of giants
var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

// Load plugins, still we like to be lazy so we use this plugin.
var $ = require('gulp-load-plugins')();

// Metalsmith
var Metal = require('gulp-load-plugins')({pattern: ['metalsmith-*', 'metalsmith.*']});
var gulpsmith = require('gulpsmith');
var markdown = require('metalsmith-markdown');
var templates = require('metalsmith-templates');
var collections = require('metalsmith-collections');
var ignore = require('metalsmith-ignore');
var wordcount = require('metalsmith-word-count');
var permalinks = require('metalsmith-permalinks');
var gulpFrontMatter = require('gulp-front-matter');
var assign = require('lodash.assign');
var wordcount = require("metalsmith-word-count");
var swig = require('swig');

console.log(Metal);

// tell me what the error is!
// -> prevent .pipe from dying on error w/ gulp-plumber
// -> and give more useful error messages
var showError = function(err) {
  console.log(err);
};

swig.setDefaults({
  cache: false
});

// Clean
gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

// Default task
gulp.task('default', ['clean'], function () {
	gulp.start('build');
});

gulp.task('build', ['jshint', 'metalsmith', 'styles', 'images', /*'fonts',*/ 'extras'], function () {
	return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('serve', ['styles', 'fonts'], function () {
	browserSync({
		notify: false,
		port: settings.port,
		server: {
			baseDir: ['.tmp', 'dist'],
			routes: {
				'/bower_components': 'bower_components'
			}
		}
	});

	// watch for changes
	gulp.watch([
		'app/labs/*.html',
		'app/scripts/**/*.js',
		'app/images/**/*',
		'.tmp/fonts/**/*',
		'dist/**/*'
	]).on('change', reload);

	gulp.watch('app/styles/**/*.scss', ['styles']);
	gulp.watch('app/fonts/**/*', ['fonts']);
	gulp.watch('app/{_posts,_templates,_pages}/**/*', ['metalsmith']);
	gulp.watch('bower.json', ['wiredep', 'fonts']);
});

// JSHint
gulp.task('jshint', function () {
	return gulp.src('app/scripts/**/*.js')
		.pipe(reload({stream: true, once: true}))
		.pipe($.jshint())
		.pipe($.jshint.reporter('jshint-stylish'))
		.pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

// Generate site with metalsmith
gulp.task('metalsmith', function () {
	return gulp.src('app/**/*.{md,html}')
		.pipe($.plumber({
			errorHandler: showError
		}))
		// TODO: Denne læser ikke korrekt dataen ind i filen
		.pipe(gulpFrontMatter({ // optional configuration
			property: 'frontMatter', // property added to file object
			remove: true // should we remove front-matter header?
		}))
		.pipe($.tap(function(file, t) {
	        assign(file, file.frontMatter);
			//delete file.frontMatter;
	    }))
		//.on('data', function addPropertyToFileObject (file) {
		//	assign(file, file.frontMatter);
		//	delete file.frontMatter;
	    //})
		.pipe($.debug({title: 'Going to gulpsmith:'}))
		.pipe(
			gulpsmith()
				.metadata({
					'title': 'Allan Kimmer Jensen',
					'description': 'Hehehehe'
				})
				.use(collections({
					pages: {
						pattern: 'app/_pages/*.md'
					},
					posts: {
						pattern: 'app/_posts/*.md',
						sortBy: 'date',
						reverse: true,
						template: 'post.html'
					}
				}))
				.use(ignore([
				  '_drafts/*',
				  '_templates/*'
				]))
				.use(wordcount())
				.use(markdown({
					smartypants: true,
					gfm: true,
					tables: true
				}))
				.use(wordcount())
				.use(permalinks({
					pattern: './:title' // Don't use /:collection for now, we want it all on root.
				}))
				.use(templates({
					'engine': 'swig',
					'directory': 'app/_templates',
					'default': 'default.html'
				}))

		)
		.pipe($.rename(function (path) {
			path.dirname = path.dirname.replace('_pages','');
		}))
		.pipe($.debug({title: 'Going to dist:'}))
		.pipe(gulp.dest('dist'));
});

gulp.task('html', ['styles'], function () {
	var assets = $.useref.assets({searchPath: ['.tmp', 'app', '.']});

	return gulp.src('dist/**/*.html')
		.pipe(assets)
		.pipe($.if('*.js', $.uglify()))
		.pipe($.if('*.css', $.csso()))
		.pipe(assets.restore())
		.pipe($.useref())
		.pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
		.pipe(gulp.dest('dist'));
});

// Images
gulp.task('images', function () {
	return gulp.src('app/images/**/*')
		.pipe($.cache($.imagemin({
			optimizationLevel: 3,
			progressive: true,
			interlaced: true
		})))
		.pipe(gulp.dest('dist/images'))
		.pipe($.size());
});

// Inject Bower components
gulp.task('wiredep', function () {
	gulp.src('app/styles/*.scss')
		.pipe(wiredep({
			directory: 'app/bower_components',
			ignorePath: 'app/bower_components/'
		}))
		.pipe(gulp.dest('app/styles'));

	gulp.src('app/_templates/*.html')
		.pipe(wiredep({
			directory: 'app/bower_components',
			ignorePath: 'app/'
		}))
		.pipe(gulp.dest('app'));
});

gulp.task('styles', function () {
	return gulp.src('app/styles/main.scss')
		.pipe($.sourcemaps.init())
		.pipe($.sass({
			outputStyle: 'nested', // libsass doesn't support expanded yet
			precision: 10,
			includePaths: ['.'],
			onError: console.error.bind(console, 'Sass error:')
		}))
		.pipe($.postcss([
			require('autoprefixer-core')({browsers: ['last 1 version']})
		]))
		.pipe($.sourcemaps.write())
		.pipe(gulp.dest('dist/styles'))
		.pipe(reload({stream: true}));
});

gulp.task('fonts', function () {
	return gulp.src(require('main-bower-files')({
		filter: '**/*.{eot,svg,ttf,woff,woff2}'
	}).concat('app/fonts/**/*'))
		.pipe(gulp.dest('.tmp/fonts'))
		.pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', function () {
	return gulp.src([
		'app/*.*',
		'!app/*.html',
		'app/CNAME'
	], {
		dot: true
	}).pipe(gulp.dest('dist'));
});

gulp.task('deploy', function() {
	var ghpages = require('gh-pages');
	var path = require('path');
	console.log(process.env);
	//if(process.env.TRAVIS === true) {
		ghpages.publish(path.join(__dirname, 'dist'), {
			repo: 'https://' + process.env.GH_TOKEN + '@github.com/Saturate/AKJIO.git',
			user: {
				name: 'Travis-CI',
				email: 'travis@akj.io'
			}
		}, function (err) { console.log(err) });
	//} else {
	//	ghpages.publish(path.join(__dirname, 'dist'), function (err) { console.log(err) });
	//}
});