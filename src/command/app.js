import { check_env } from '../action/check_env.js';
import { get_config_data } from '../action/get_config_data.js';
import { pre_initial_build } from '../action/initial_build.js';
import { get_ports } from '../action/port.js';
import { present } from '../action/present.js';
import { FOLDER_GEN_PLUGINS } from '../constants/folder.js';
import { Config } from '../utils/config.js';
import { Plugin } from '../utils/plugin.js';
import { app_server } from '../utils/server.js';
import { UniqId } from '../vars/uniq_id.js';

export const app_command = async (config) => {
    await check_env();
    const { port } = await get_ports(config);
    Config.set('port', port);

    const build_id = UniqId.load();
    UniqId.set(build_id || UniqId.get());

    const config_data = get_config_data(config, build_id);
    present(config_data);

    await pre_initial_build(build_id, config_data);


    // Initialize Plugins
    const plugin_files = await Plugin.load(FOLDER_GEN_PLUGINS);
    const plugins = await Plugin.generate(plugin_files);
    if (plugins) {
        Plugin.cache = plugins;
    }

    app_server('localhost', port);

    return build_id;
};
