/*
	GROW

	Enables you yo take some content and grow it into a site.
*/
'use strict';

import fs from 'fs';
import through from 'through2'; // npm install --save through2

// Consts
const NAME = 'Water';

function Water () {
	console.log('water!');
	this.settings = {
		template: 'template/'
	};
}

var test = function() {
	return through.obj(function(file, encoding, callback) {
		callback(null, Water(file));
	});
};
fs.createReadStream('README.md').pipe(test);

// Gulp
module.exports = test;
