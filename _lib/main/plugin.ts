import { Config } from '@lib/config';
import { Env } from '@lib/env';
import { File } from '@lib/file';
import { Global } from '@lib/global';
import { fail } from '@lib/helper/endings';
import { EnvType } from '@lib/struc/env';
import { Plugin } from '@lib/plugin';
import { join } from 'path';
import { ReleasePath } from '@lib/vars/release_path';

export const plugins = async () => {
    const plugin_files = File.collect_files(join('gen', 'plugins'));
    // allow plugins to modify the global config
    let global = Config.get(null);

    global.release_path = ReleasePath.get();
    global.env = EnvType[Env.get()];

    await Plugin.init(plugin_files, global);
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [error_before, config_before, global_before] = await Plugin.before(
        'global',
        global
    );
    /* eslint-enable */
    if (error_before) {
        fail(error_before);
    }
    if (global_before != null) {
        global = global_before;
    }
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [error_after, config_after, global_after] = await Plugin.after(
        'global',
        global
    );
    /* eslint-enable */
    if (error_after) {
        fail(error_after);
    }
    if (global_after != null) {
        global = global_after;
    }
    await Global.set('global', global);
    // update the config
    Plugin.config = global;

    return null;
};
