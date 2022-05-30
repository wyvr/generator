import { join } from 'path';
import { FOLDER_GEN } from '../constants/folder.js';
import { create_dir, remove } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Cwd } from '../vars/cwd.js';

export function clear_gen() {
    Logger.debug('clear gen folder');
    const gen_folder = join(Cwd.get(), FOLDER_GEN);
    remove(gen_folder);
    create_dir(gen_folder);
}
