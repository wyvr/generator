const fs = require('fs');
const path = require('path');
const cwd = process.cwd();

module.exports = {
    to_extension(filename, extension) {
        if(!filename || typeof filename != 'string') {
            console.error('no filename provided');
            return '';
        }
        const splitted = filename.split('.');
        if (splitted.length <= 1) {
            console.error('no file extension in the filename');
            return filename;
        }
        // remove last element => extension
        splitted.pop();

        extension.trim();
        if(extension.indexOf('.') == 0) {
            extension = extension.replace(/^\./, '');
        }
        return [...splitted, extension].join('.');
    },
};
