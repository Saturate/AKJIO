/*
	WATER

	Enables you yo take some content and grow it into a site.

	It does not optimize anything, it just makes Markdown into HTML.
	It uses a special header in each file to get meta-data about the current file.

	For optimizing you could plug Water into a Gulp pipe, that could minify assets and such.

	TODO:
		- Buckets/Collcetions:
			A page is a collection with defaults, and blogposts are another.
			You can make your own if you like two blogs ect. These can be used for metadata also.
		- Word Count / Reading time
			Expand the meta data by calulate these two things. Useful for readers.
*/
'use strict';

var fs = require('fs');
var path = require('path');
const through = require('through2'); // npm install --save through2
const matter = require('gray-matter'); // npm i gray-matter --save
const marked = require('marked'); // npm install marked --save
const nunjucks = require('nunjucks'); // npm install nunjucks --save
var gutil = require('gulp-util');

var waterTransform = function(options) {
	return through.obj(function(file, encoding, callback) {

		if (file.isNull()) {
			callback(null, file);
			return;
		}

		if (file.isStream()) {
			callback(new gutil.PluginError('gulp-water', 'Streaming not supported'));
			return;
		}

		// Merge defaults and options to get settings
		var settings = Object.assign({
			templates: './app/_templates/',
			contentPath: '/content',
			pages: '/pages',
			posts: '/posts'
		}, options);

		console.log(file.path);

		var contents = file.contents.toString();

		// Get the frontmatter, this is meta data
		var foo = matter(contents);

		// Compile the Markdown to HTML
		var transformedContents = marked(foo.content);

		var env = nunjucks.configure(settings.templates);

		env.addFilter('date', function(str, count) {
			return str;
		});

		// Merge all options
		var renderOptions = Object.assign({ template: 'default.html' }, foo.data, { contents: transformedContents });
		var res = env.render('./post.html', renderOptions);

		//console.log('CONTENT (%s - %s):\n\n', foo.data.title, file, res, renderOptions);

		file.contents = new Buffer(res);

		// TODO: Write paths corrently
		file.path = gutil.replaceExtension(file.path, '.html');

		file.path = file.path.replace('pages\\','');
		file.path = file.path.replace('posts\\','');

		function parsePath(filePath) {
			var extname = path.extname(filePath);
			return {
				dirname: path.dirname(filePath),
				basename: path.basename(filePath, extname),
				extname: extname
			};
		}

		var pathObj = parsePath(file.path);
		console.log(pathObj);

		console.log(
			path.normalize(file.path),
			path.normalize(settings.posts),
			path.normalize(file.path).match(path.normalize(settings.posts))

		);

		// Check if it's in the pages dir.
		if(path.normalize(file.path).match(path.normalize(settings.posts))) {
			pathObj.basename = 'index';
		}

		file.path = path.join(pathObj.dirname, pathObj.basename + pathObj.extname);

		console.log(file.path);

		callback(null, file);
	});
};


/*
fs.readdir('content/pages', function(err, files) {
	files.forEach();
});*/

//fs.createReadStream('README.md').pipe(test);

// Gulp
module.exports = waterTransform;
