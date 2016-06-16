/*
	Recipe

	Enables you yo take some content and put it in a site.
*/

var through = require('through2');    // npm install --save through2

// Consts
const PLUGIN_NAME = 'gulp-recipe';

module.exports = function() {
	return through.obj(function(file, encoding, callback) {
		callback(null, doSomethingWithTheFile(file));
	});
};