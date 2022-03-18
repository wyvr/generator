import {mkdirSync, removeSync} from 'fs-extra';
import { join } from 'path';
import { Cwd } from '@lib/vars/cwd';

export class Dir {
    /**
     * create a new directory in the current project
     * @param dir_name path of the new directory
     */
    static create(dir_name) {
        const dir_path = join(Cwd.get(), dir_name);
        mkdirSync(dir_path, { recursive: true });
    }
    /**
     * delete a directoy in the current project
     * @param dir_name path of the directory which should be deleted
     */
    static delete(dir_name) {
        removeSync(dir_name);
    }
    /**
     * clears the content of the given directory in the current project
     * @param dir_name path of the directory
     */
    static clear(dir_name) {
        this.delete(dir_name)
        this.create(dir_name)
    }
}
