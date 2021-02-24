const fs = require('fs');
const path = require('path');
const cwd = process.cwd();

module.exports = {
    create(dir_name) {
        const dir_path = path.join(cwd, dir_name);
        fs.mkdirSync(dir_path, { recursive: true });
    },
};
