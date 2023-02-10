import { cpus } from 'os';
import { get_config_data } from './get_config_data.js';
import { collect_packages } from './package.js';
import { present } from './present.js';
import { FOLDER_MEDIA, FOLDER_RELEASES, FOLDER_STORAGE } from '../constants/folder.js';
import { package_report } from '../presentation/package_report.js';
import { Config } from '../utils/config.js';
import { read_json, symlink } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { Storage } from '../utils/storage.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { WorkerController } from '../worker/controller.js';
import { clear_gen } from './clear_gen.js';
import { i18n } from './i18n.js';
import { transform } from './transform.js';
import { dependencies } from './dependencies.js';
import { configure } from './configure.js';
import { compile } from './compile.js';
import { routes } from './route.js';
import { build } from './build.js';
import { to_identifiers } from '../utils/to.js';
import { scripts } from './script.js';
import { media } from './media.js';
import { copy_static_generated } from './copy_static_generated.js';
import { copy } from './copy.js';
import { set_config_cache } from '../utils/config_cache.js';
import { build_cache } from '../utils/exec.js';
import { wyvr_internal } from './wyvr_internal.js';
import { join } from 'path';
import { NoWorker } from '../no_worker.js';
import { Event } from '../utils/event.js';
import { modify_svelte } from './modify_svelte.mjs';

export async function pre_initial_build(build_id, config_data) {
    await modify_svelte();
    
    // set release folder
    ReleasePath.set(Cwd.get(FOLDER_RELEASES, build_id));

    // Build Global(storage) Data
    Storage.set_location(FOLDER_STORAGE);
    await Storage.set('config', config_data);

    // Collect packages
    const package_json = read_json('package.json');
    const { available_packages, disabled_packages } = await collect_packages(package_json);
    package_report(available_packages, disabled_packages);

    await Storage.set('config', Config.get());

    // set worker ratio
    WorkerController.set_worker_ratio(Config.get('worker.ratio', 1));

    if (config_data?.cli?.flags?.single) {
        Logger.warning('running in single threaded mode, no workers will be started');
        WorkerController.set_multi_threading(false);
        WorkerController.create_workers(1, () => {
            return {
                pid: process.pid,
                on: (key, fn) => {
                    Event.on('master', key, async (...args) => {
                        await fn(...args);
                    });
                },
            };
        });
        NoWorker();
    } else {
        // Create the workers for the processing
        const worker_amount = WorkerController.get_worker_amount_from_ratio();
        Logger.present('worker', worker_amount, Logger.color.dim(`of ${cpus().length} threads`));
        WorkerController.create_workers(worker_amount);
    }

    // Create required symlinks
    symlink(Cwd.get(FOLDER_MEDIA), join(ReleasePath.get(), FOLDER_MEDIA));

    return {
        package_json,
        available_packages,
        disabled_packages,
    };
}

export async function intial_build(build_id, config) {
    const config_data = get_config_data(config, build_id);

    present(config_data);

    // clear gen folder
    clear_gen();

    const { available_packages } = await pre_initial_build(build_id, config_data);

    // Copy static files from packages
    // Copy files from packages and override in the package order
    // Copy configured asset files
    // Build Tree of files and packages
    const { package_tree, mtime } = await copy(available_packages);

    // Create Translations/I18N
    await i18n(available_packages);

    // Transform Svelte files to client and server components
    await transform();

    // Initialize Plugins
    await Plugin.initialize();

    // Extract dependencies
    await dependencies();

    // update the config in the workers from transform and depencenies
    await configure();

    // Compile svelte files
    await compile(available_packages);

    // Execute Routes
    const route_identifiers = await routes(package_tree, mtime);

    // Build Pages
    const build_result = await build();

    // combine identifiers
    const identifiers = to_identifiers(route_identifiers, build_result.identifiers);
    set_config_cache('identifiers', identifiers);

    //  Inject Data into the pages
    // @TODO

    // Build Scripts
    await scripts(identifiers);

    // Generate Media/Images
    await media(build_result.media);

    // Copy static and generated files into release
    await copy_static_generated();

    // Copy wyvr internal files into release in dev mode
    await wyvr_internal();

    await build_cache();

    // console.log(build_result)

    return {
        packages: available_packages,
        identifiers,
        media: build_result.media,
        media_query_files: build_result.media_query_files,
    };
}
