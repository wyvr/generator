import cluster from 'cluster';
import { check_env } from '../action/check_env.js';
import { clear_releases } from '../action/clear_releases.js';
import { critical } from '../action/critical.js';
import { get_config_data } from '../action/get_config_data.js';
import { intial_build, pre_initial_build } from '../action/initial_build.js';
import { optimize } from '../action/optimize.js';
import { get_ports } from '../action/port.js';
import { present } from '../action/present.js';
import { publish } from '../action/publish.js';
import { FOLDER_GEN_PLUGINS } from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { pub_config_cache, set_config_cache } from '../utils/config_cache.js';
import { is_pub_valid } from '../utils/health.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { UniqId } from '../vars/uniq_id.js';
import { WorkerController } from '../worker/controller.js';
import { WorkerStatus } from '../struc/worker_status.js';
import { Event } from '../utils/event.js';
import { chat_start } from '../utils/chat.js';

export const app_command = async (config) => {
    if (config?.cli?.flags?.single) {
        Logger.error('app is not available in single threaded mode');
        return;
    }
    await check_env();
    const { port } = await get_ports(config);

    let build_id = UniqId.load();
    let build_needed = false;
    if (!build_id || !is_pub_valid()) {
        build_needed = true;
        build_id = UniqId.get();
    }
    UniqId.set(build_id);

    if (build_needed) {
        UniqId.persist();
        Logger.warning('no build id or pub folder found, build is required');

        const { media_query_files } = await intial_build(build_id, config);

        // Generate critical css
        const critical_result = await critical();

        // Optimize Pages
        await optimize(media_query_files, critical_result);

        // Publish the new release
        await publish();

        await clear_releases(build_id);
    } else {
        const config_data = get_config_data(config, build_id);

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
    // kill all workers from the initial generation
    WorkerController.exit();

    // start all possible workers
    Logger.debug('start cluster forks');

    // provision the new workers as app server
    Event.on('worker_status', WorkerStatus.exists, (worker) => {
        WorkerController.send_action(worker, WorkerAction.mode, { mode: 'app', port });
    });

    await WorkerController.initialize(1, false, () => {
        const instance = cluster.fork();
        instance.pid = instance.process.pid;
        return instance;
    });

    Logger.debug('done cluster forks');

    await new Promise((resolve, reject) => {
        const amount = WorkerController.get_worker_amount();
        Logger.debug('worker amount', amount);
        const safe_guard = setTimeout(() => {
            clearInterval(interval);
            reject('creating cluster worker timeout');
        }, 30000);
        const interval = setInterval(() => {
            const busy = WorkerController.get_workers_by_status(WorkerStatus.busy).length;
            Logger.debug('busy', busy);
            // when a single worker come active end safe guard
            if (busy > 0) {
                clearTimeout(safe_guard);
            }
            if (busy == amount) {
                clearInterval(interval);
                Logger.info('all worker started');
                resolve();
            }
        }, 250);
    });

    // reset the exiting state
    WorkerController.exiting = false;

    // start the chat
    chat_start();

    // keep command open, otherwise the workers will get killed
    return new Promise(() => {});
};
