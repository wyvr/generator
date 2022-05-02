import { cpus } from 'os';
import { join } from 'path';
import { check_env } from '../action/check_env.js';
import { copy_files, copy_folder } from '../action/copy.js';
import { get_config_data } from '../action/get_config_data.js';
import { collect_i18n, write_language } from '../action/i18n.js';
import { collect_packages } from '../action/package.js';
import { present } from '../action/present.js';
import { terminate } from '../cli/terminate.js';
import {
    FOLDER_GEN,
    FOLDER_GEN_ASSETS,
    FOLDER_GEN_PLUGINS,
    FOLDER_LIST_PACKAGE_COPY,
    FOLDER_PLUGINS,
    FOLDER_RELEASES,
    FOLDER_STORAGE,
} from '../constants/folder.js';
import { env_report } from '../presentation/env_report.js';
import { package_report } from '../presentation/package_report.js';
import { Config } from '../utils/config.js';
import { read, read_json, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { Storage } from '../utils/storage.js';
import { replace_import_path } from '../utils/transform.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { UniqId } from '../vars/uniq_id.js';
import { WorkerController } from '../worker/controller.js';

export const build_command = async (config) => {
    const check_env_report = await check_env();
    // execution can end here when environment is not correct
    env_report(check_env_report);
    terminate(!check_env_report || !check_env_report.success);
    
    const build_id = UniqId.get();
    UniqId.set(build_id);
    const config_data = get_config_data(config, build_id);

    // set release folder
    ReleasePath.set(join(Cwd.get(), FOLDER_RELEASES, build_id));

    present(config_data);

    //  Build Global(storage) Data
    Storage.set_location(FOLDER_STORAGE);
    await Storage.set('config', config_data);

    //  Collect packages
    const package_json = read_json('package.json');
    const { available_packages, disabled_packages } = await collect_packages(package_json);
    package_report(available_packages, disabled_packages);

    // set worker ratio
    WorkerController.set_worker_ratio(Config.get('worker.ratio', 0));
    Logger.present('worker', WorkerController.get_worker_amount(), Logger.color.dim(`of ${cpus().length} threads`));

    //  Initialize Plugins
    const plugin_files = await Plugin.load(FOLDER_GEN_PLUGINS);
    const plugins = await Plugin.generate(plugin_files);
    if (plugins) {
        Plugin.cache = plugins;
    }
    // @TODO
    //  Copy static files from packages
    //  Copy files from packages and override in the package order
    const package_tree = {};
    available_packages.forEach((pkg) => {
        copy_folder(pkg.path, FOLDER_LIST_PACKAGE_COPY, join(Cwd.get(), FOLDER_GEN), (file, target) => {
            package_tree[file.target] = pkg;
            if (target.indexOf(`/${FOLDER_PLUGINS}/`) > -1) {
                write(target, replace_import_path(read(target)));
            }
        });
    });

    //  Copy configured asset files
    const assets = Config.get('assets');
    copy_files(assets, join(Cwd.get(), FOLDER_GEN_ASSETS));

    //  Create Translations/I18N
    const i18n = collect_i18n(available_packages);
    Object.keys(i18n).forEach((language) => {
        write_language(language, i18n[language]);
    });

    WorkerController.create_workers(WorkerController.get_worker_amount());

    //  Transform Svelte files to client and server components
    // @TODO
    //  Build Tree of files and packages
    // @TODO

    //  Execute Routes
    // @TODO
    //  Build Pages
    // @TODO
    //  Inject Data into the pages
    // @TODO
    //  Build Script dependencies
    // @TODO
    //  Build Scripts
    // @TODO
    //  Create Sitemap
    // @TODO
    //  Create Symlinks
    // @TODO
    //  Generate Media/Images
    // @TODO
    //  Optimize Pages
    // @TODO
    return 'build';
};
