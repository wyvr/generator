import { check_env } from '../action/check_env.js';
import { get_config_data } from '../action/get_config_data.js';
import { intial_build, pre_initial_build } from '../action/initial_build.js';
import { present } from '../action/present.js';
import { FOLDER_GEN, FOLDER_RELEASES } from '../constants/folder.js';
import { EnvType } from '../struc/env.js';
import { exists } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { watch_server } from '../utils/server.js';
import { package_watcher } from '../utils/watcher.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { UniqId } from '../vars/uniq_id.js';
import { Config } from '../utils/config.js';
import { get_ports } from '../action/port.js';
import { publish } from '../action/publish.js';
import { Plugin } from '../utils/plugin.js';
import { WorkerController } from '../worker/controller.js';

export async function dev_command(config) {
    // dev command has forced dev state, when nothing is defined
    if (Env.get() == EnvType.prod) {
        Env.set(EnvType.dev);
    }

    await check_env();
    const { port, wsport } = await get_ports(config);
    Config.set('port', port);
    Config.set('wsport', wsport);

    const build_id = UniqId.load();
    UniqId.set(build_id || UniqId.get());
    // check if fast build is available

    let packages;
    const is_fast = is_fast_build(config, build_id);
    if (!is_fast && config?.cli?.flags?.fast) {
        Logger.warning('fast build is not available');
    }
    const config_data = get_config_data(config, build_id);

    await WorkerController.initialize(Config.get('worker.ratio', 1), config_data?.cli?.flags?.single);

    if (is_fast) {
        present(config_data);
        const { available_packages } = await pre_initial_build(build_id, config_data);

        await Plugin.initialize();

        packages = available_packages;
    } else {
        const result = await intial_build(build_id, config_data);
        packages = result.packages;
    }
    await publish();

    watch_server('localhost', port, wsport, packages);

    await package_watcher(packages);

    return build_id;
}
export function is_fast_build(config, build_id) {
    return config?.cli?.flags?.fast && exists(Cwd.get(FOLDER_RELEASES, build_id)) && exists(Cwd.get(FOLDER_GEN));
}
