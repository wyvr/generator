const fs = require('fs');
const path = require('path');
const cwd = process.cwd();

module.exports = {
    to_extension(filename, extension) {
        if (!filename || typeof filename != 'string' || !extension || typeof extension != 'string') {
            return '';
        }
        const splitted = filename.split('.');
        if (splitted.length <= 1) {
            return filename;
        }
        // remove last element => extension
        splitted.pop();
        extension.trim();
        if (extension.indexOf('.') == 0) {
            extension = extension.replace(/^\./, '');
        }
        return [...splitted, extension].join('.');
    },
    // create the directory to contain a specific file
    create_dir(filename) {
        const dir_path = path.dirname(filename);
        fs.mkdirSync(dir_path, { recursive: true });
    }
};
