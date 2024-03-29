import { check_env } from '../action/check_env.js';
import { get_config_data } from '../action/get_config_data.js';
import { get_present_command } from '../action/present.js';
import { FOLDER_CACHE, FOLDER_GEN, FOLDER_MEDIA, FOLDER_RELEASES, FOLDER_STORAGE } from '../constants/folder.js';
import { remove } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { is_object } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { UniqId } from '../vars/uniq_id.js';

export const clear_command = async (config) => {
    await check_env();

    const build_id = UniqId.load();
    UniqId.set(build_id || UniqId.get());
    UniqId.persist();
    ReleasePath.set(Cwd.get(FOLDER_RELEASES, UniqId.get()));

    const config_data = get_config_data(config, build_id);

    const { command, flags } = get_present_command(config_data?.cli?.command, config_data?.cli?.flags);
    process.title = `wyvr ${command}`;
    Logger.present('command', command, Logger.color.dim(flags));

    const default_flags = ['cache'];
    const flags_array = is_object(config_data?.cli?.flags) ? Object.keys(config_data.cli.flags) : default_flags;

    const clear_folders = [];

    if (flags_array.find((flag) => ['hard', 'cache'].indexOf(flag) > -1)) {
        clear_folders.push(FOLDER_CACHE);
    }
    if (flags_array.find((flag) => ['hard', 'gen'].indexOf(flag) > -1)) {
        clear_folders.push(FOLDER_GEN);
    }
    if (flags_array.find((flag) => ['media'].indexOf(flag) > -1)) {
        clear_folders.push(FOLDER_MEDIA);
    }
    if (flags_array.find((flag) => ['hard', 'storage'].indexOf(flag) > -1)) {
        clear_folders.push(FOLDER_STORAGE);
    }

    Logger.present('clearing', clear_folders.join(' '));
    clear_folders.forEach((folder) => {
        remove(Cwd.get(folder));
    });

    return clear_folders.join(' ');
};
