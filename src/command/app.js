import { check_env } from '../action/check_env.js';
import { clear_releases } from '../action/clear_releases.js';
import { critical } from '../action/critical.js';
import { get_config_data } from '../action/get_config_data.js';
import { intial_build, pre_initial_build } from '../action/initial_build.js';
import { optimize } from '../action/optimize.js';
import { get_ports } from '../action/port.js';
import { present } from '../action/present.js';
import { publish } from '../action/publish.js';
import { sitemap } from '../action/sitemap.js';
import { FOLDER_GEN_PLUGINS } from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { Config } from '../utils/config.js';
import { pub_config_cache, set_config_cache } from '../utils/config_cache.js';
import { is_pub_valid } from '../utils/health.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { UniqId } from '../vars/uniq_id.js';
import { WorkerController } from '../worker/controller.js';

export const app_command = async (config) => {
    await check_env();
    const { port } = await get_ports(config);
    Config.set('port', port);

    let build_id = UniqId.load();
    let build_needed = false;
    if (!build_id || !is_pub_valid()) {
        build_needed = true;
        build_id = UniqId.get();
    }
    UniqId.set(build_id);

    if (build_needed) {
        Logger.warning('no build id or pub folder found, build is required');

        const { media_query_files } = await intial_build(build_id, config);

        // Generate critical css
        const critical_result = await critical();

        // Optimize Pages
        await optimize(media_query_files, critical_result);

        // Create sitemap
        await sitemap();

        // Publish the new release
        await publish();

        await clear_releases(build_id);
    } else {
        present(config_data);

        await pre_initial_build(build_id, config_data);

        // Initialize Plugins
        const plugin_files = await Plugin.load(FOLDER_GEN_PLUGINS);
        const plugins = await Plugin.generate(plugin_files);
        if (plugins) {
            Plugin.cache = plugins;
            await set_config_cache('plugins', plugins);
        }

        // set config cache for the workers to operate correctly
        pub_config_cache('dependencies.config');
        pub_config_cache('dependencies.top');
        pub_config_cache('i18n');
        pub_config_cache('route.cache');
        pub_config_cache('page.cache');
    }

    



    app_server('localhost', port);

    // keep command open, otherwise the workers will get killed
    return new Promise(() => {});
};
