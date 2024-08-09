import { get_config_data } from './get_config_data.js';
import { collect_packages } from './package.js';
import { present } from './present.js';
import { FOLDER_ASSETS, FOLDER_GEN_EVENTS, FOLDER_I18N, FOLDER_JS, FOLDER_MEDIA, FOLDER_PROP, FOLDER_RELEASES } from '../constants/folder.js';
import { package_report } from '../presentation/package_report.js';
import { Config } from '../utils/config.js';
import { read_json, symlink } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { WorkerController } from '../worker/controller.js';
import { clear_gen } from './clear_gen.js';
import { i18n } from './i18n.js';
import { transform } from './transform.js';
import { dependencies } from './dependencies.js';
import { configure } from './configure.js';
import { compile } from './compile.js';
import { pages } from './page.js';
import { build } from './build.js';
import { to_identifiers } from '../utils/to.js';
import { scripts } from './script.js';
import { media } from './media.js';
import { copy_static_generated } from './copy_static_generated.js';
import { copy } from './copy.js';
import { set_config_cache } from '../utils/config_cache.js';
import { build_cache } from '../utils/routes.js';
import { wyvr_internal } from './wyvr_internal.js';
import { modify_svelte } from './modify_svelte.mjs';
import { get_error_message } from '../utils/error.js';
import { collections } from './collections.js';
import { Env } from '../vars/env.js';
import { build_cache as build_media_cache } from '../utils/media.js';
import { cronjobs } from './cronjobs.js';
import { update_project_events } from '../utils/project_events.js';
import { KeyValue } from '../../storage.js';
import { STORAGE_CONFIG } from '../constants/storage.js';
import { optimize_assets } from './optimize_assets.js';
import { optimize_pages } from './optimize_pages.js';

export async function pre_initial_build(build_id, config_data) {
    try {
        await modify_svelte();
    } catch (e) {
        Logger.error(get_error_message(e, undefined, 'initial build'));
        process.exit(1);
    }

    // set release folder
    ReleasePath.set(Cwd.get(FOLDER_RELEASES, build_id));

    // Build Global(storage) Data
    const config_db = new KeyValue(STORAGE_CONFIG);
    config_db.setObject(config_data);

    // Collect packages
    const package_json = read_json('package.json');
    const { available_packages, disabled_packages } = await collect_packages(package_json);
    package_report(available_packages, disabled_packages);

    config_db.setObject(Config.get());

    await WorkerController.initialize(Config.get('worker.ratio', 1), config_data?.cli?.flags?.single);

    // Create required symlinks
    symlink(Cwd.get(FOLDER_MEDIA), ReleasePath.get(FOLDER_MEDIA));
    // build media cache
    build_media_cache();

    return {
        package_json,
        available_packages,
        disabled_packages
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
    const { package_tree } = await copy(available_packages);

    // Create Translations/I18N
    await i18n(available_packages);

    await copy_static_generated([FOLDER_ASSETS, FOLDER_I18N]);

    // @TODO optimize assets
    await optimize_assets();

    // Transform Svelte files to client and server components
    await transform();

    // Reload the events
    await update_project_events(FOLDER_GEN_EVENTS);

    // Initialize Plugins
    await Plugin.initialize();

    // Extract dependencies
    await dependencies();

    // update the config in the workers from transform and depencenies
    await configure();

    // Compile svelte files
    await compile(available_packages);

    // Execute Pages
    const pages_result = await pages(package_tree);

    await build_cache();

    // Process Collections
    await collections(pages_result.collections);

    // Build Pages
    const build_result = await build();

    // combine identifiers
    const identifiers = to_identifiers(pages_result.identifiers, build_result.identifiers);
    await set_config_cache('identifiers', identifiers);

    // Build Scripts
    if (Env.is_dev()) {
        // add custom script for the 404 and 500 development page
        identifiers.wyvr_development = {
            identifier: 'wyvr_development',
            doc: '',
            layout: '',
            page: ''
        };
    }
    await scripts(identifiers);

    // replace the js files in the generated pages
    await optimize_pages();

    // Generate Media/Images
    // @TODO currently there are never medias returned from build
    await media(build_result.media);

    // Copy static and generated files into release
    await copy_static_generated([FOLDER_JS, FOLDER_PROP]);

    // Copy wyvr internal files into release in dev mode
    await wyvr_internal();

    await cronjobs('build');

    return {
        packages: available_packages,
        identifiers,
        media: build_result.media,
        media_query_files: build_result.media_query_files
    };
}
