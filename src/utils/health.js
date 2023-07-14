import { lstatSync } from 'fs';
import { terminate } from '../cli/terminate.js';
import { FOLDER_PUBLISH } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { exists } from './file.js';
import { Logger } from './logger.js';

export function pub_healthcheck() {
    if (!is_pub_valid()) {
        Logger.error('pub is not available');
        terminate(true);
    }
}
export function is_pub_valid() {
    const pub = Cwd.get(FOLDER_PUBLISH);
    if (exists(pub)) {
        const is_symlink = lstatSync(pub).isSymbolicLink();
        if (is_symlink) {
            return true;
        }
    }
    return false;
}
