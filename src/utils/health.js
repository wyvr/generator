import { lstatSync } from 'node:fs';
import { terminate } from '../cli/terminate.js';
import { FOLDER_PUBLISH } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { exists } from './file.js';
import { Logger } from './logger.js';

/**
 * Terminate the generator when the pub folder is not valid
 */
export function pub_healthcheck() {
    /* c8 ignore start */
    if (!is_pub_valid()) {
        Logger.error('pub is not available');
        terminate(true);
    }
    /* c8 ignore end */
}

/**
 * Returns whether the pub folder is valid or not
 * @returns {boolean}
 */
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
