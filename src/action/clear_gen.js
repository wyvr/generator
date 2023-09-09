import { FOLDER_CACHE, FOLDER_GEN } from '../constants/folder.js';
import { create_dir, remove } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Cwd } from '../vars/cwd.js';

export function clear_gen() {
    Logger.debug('clear gen folder');
    const gen_folder = Cwd.get(FOLDER_GEN);
    remove(gen_folder);
    create_dir(gen_folder);

    Logger.debug('clear persisted routes');
    remove(Cwd.get(FOLDER_CACHE, 'routes_persisted.txt'));
}
