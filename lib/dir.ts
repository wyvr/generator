import * as fs from 'fs-extra';
import { join } from 'path';

export class Dir {
    static create(dir_name) {
        const cwd = process.cwd();
        const dir_path = join(cwd, dir_name);
        fs.mkdirSync(dir_path, { recursive: true });
    }
    static delete(dir_name) {
        fs.removeSync(dir_name);
    }
    static clear(dir_name) {
        this.delete(dir_name)
        this.create(dir_name)
    }
}
