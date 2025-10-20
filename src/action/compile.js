import { extname } from 'node:path';
import { FOLDER_GEN_SRC, FOLDER_NODE_MODULES } from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_error_message } from '../utils/error.js';
import { collect_files, read, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { to_server_path } from '../utils/to.js';
import { Cwd } from '../vars/cwd.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';
import { PLUGIN_COMPILE } from '../constants/plugins.js';

export async function compile(available_packages) {
    const name = 'compile';
    await measure_action(name, async () => {
        const package_paths = available_packages.map((p) => p.path).filter((x) => x);
        // get all node module packages with svelte files in them for compilation
        const node_modules = {};
        const node_modules_files = collect_files(Cwd.get(FOLDER_NODE_MODULES), '.svelte')
            .filter((file) => !file.includes('/wyvr/') && !file.includes('/@wyvr/') && !package_paths.find((path) => file.includes(path)))
            .map((file) => {
                // /var/www/html/node_modules/swiper/svelte/swiper.svelte
                // /var/www/html/node_modules/@corp/swiper/svelte/swiper.svelte
                const module_path = file.replace(/^(.*?\/node_modules\/(?:@[^/]+\/[^/]+|[^/]+)).*/, '$1');
                node_modules[module_path] = true;
                return file;
            });
        const node_packages = Object.keys(node_modules);

        if (node_packages.length > 0) {
            Logger.info('include', node_packages.length, 'node packages for server transformation');
        }
        // replace .svelte references from all files in the packages
        for (const node_package of node_packages) {
            for (const file of collect_files(node_package)) {
                if (extname(file) === '.svelte') {
                    continue;
                }
                try {
                    const content = read(file);
                    // generate server file
                    const server_file = to_server_path(file);
                    write(server_file, content ? content.replace(/\.svelte/g, '.js') : '');
                } catch (e) {
                    Logger.error(get_error_message(e, file, 'compile'));
                }
            }
        }

        // build data of all svelte files
        const data = [].concat(collect_files(Cwd.get(FOLDER_GEN_SRC), '.svelte'), node_modules_files);

        // wrap in plugin
        const caller = await Plugin.process(PLUGIN_COMPILE, data);
        await caller(async (data) => {
            await WorkerController.process_in_workers(WorkerAction.compile, data, 10);
            return data;
        });
    });
}
