import { check_env } from '../action/check_env.js';
import { get_config_data } from '../action/get_config_data.js';
import { get_present_command } from '../action/present.js';
import { FOLDER_CACHE, FOLDER_GEN, FOLDER_MEDIA, FOLDER_RELEASES, FOLDER_STORAGE } from '../constants/folder.js';
import { remove } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { filled_array, is_object } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { UniqId } from '../vars/uniq_id.js';

export async function clear_command(config) {
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

    const clear_folders = clear(flags_array);
    return clear_folders.join(' ');
}

export function clear(flags) {
    if (!filled_array(flags)) {
        return [];
    }
    const clear_folders = [];

    if (flags.find((flag) => ['hard', 'cache'].indexOf(flag) > -1)) {
        clear_folders.push(FOLDER_CACHE);
    }
    if (flags.find((flag) => ['hard', 'gen'].indexOf(flag) > -1)) {
        clear_folders.push(FOLDER_GEN);
    }
    if (flags.find((flag) => ['media'].indexOf(flag) > -1)) {
        clear_folders.push(FOLDER_MEDIA);
    }
    if (flags.find((flag) => ['hard', 'storage'].indexOf(flag) > -1)) {
        clear_folders.push(FOLDER_STORAGE);
    }

    Logger.present('clearing', clear_folders.join(' '));
    for (const folder of clear_folders) {
        remove(Cwd.get(folder));
    }
    return clear_folders;
}
