import * as fs from 'fs-extra';
import { join } from 'path';

module.exports = {
    create(dir_name) {
        const cwd = process.cwd();
        const dir_path = join(cwd, dir_name);
        fs.mkdirSync(dir_path, { recursive: true });
    },
    delete(dir_name) {
        fs.removeSync(dir_name);
    },
};
