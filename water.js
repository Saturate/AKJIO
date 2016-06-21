/*
	WATER

	Enables you yo take some content and grow it into a site.

	It does not optimize anything, it just makes Markdown into HTML.
	It uses a special header in each file to get meta-data about the current file.

	For optimizing you could plug Water into a Gulp pipe, that could minify assets and such.
*/
'use strict';

const fs = require('fs');
const through = require('through2'); // npm install --save through2
const matter = require('gray-matter'); // npm i gray-matter --save
const marked = require('marked'); // npm install marked --save
const nunjucks = require('nunjucks'); // npm install nunjucks --save

// Consts

function water () {
	console.log('water!');

	var defaults = {
		template: '/template',
		contentPath: '/content',
		pages: '/pages',
		posts: '/posts'
	};

	//this.settings = defaults;
}

var test = function() {
	return through.obj(function(file, encoding, callback) {
		console.log(file);
		callback(null, water(file));
	});
};

fs.readdir('content/pages', function(err, files) {
	console.log(files);
	var data = '';

	var readableStream = fs.createReadStream('content/pages/' + files[7]);

	readableStream.on('data', function(chunk) {
		data+=chunk;
	});

	readableStream.on('end', function() {
		var foo = matter(data);
		var content = marked(foo.content);

		// TODO:
		// Find out how to set the LAYOUT / extends in nunjucks from a string, we need to set a default one and then be able to override this from the greymatter plugin.
		content = nunjucks.renderString(content, foo.data);

		console.log('CONTENT (%s - %s):\n\n', foo.data.title, files[6], content);
	});
});

//fs.createReadStream('README.md').pipe(test);

// Gulp
module.exports = test;
