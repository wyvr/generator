import { join } from 'path';
import { FOLDER_ASSETS, FOLDER_CSS, FOLDER_GEN } from '../constants/folder.js';
import { nano_to_milli } from '../utils/convert.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { copy_folder } from './copy.js';

export async function copy_static_generated() {
    const name = 'copy';
    const start = process.hrtime.bigint();
    Logger.start(name);

    await Plugin.before(name);

    copy_folder(join(Cwd.get(), FOLDER_GEN), [FOLDER_ASSETS, FOLDER_CSS], ReleasePath.get());

    await Plugin.after(name);

    Logger.stop(name, nano_to_milli(process.hrtime.bigint() - start));
}
