import { join } from 'path';
import { check_env } from '../action/check_env.js';
import { copy_files, copy_folder } from '../action/copy.js';
import { collect_i18n, write_language } from '../action/i18n.js';
import { collect_packages } from '../action/package.js';
import { terminate } from '../cli/terminate.js';
import { FOLDER_GEN, FOLDER_GEN_ASSETS, FOLDER_LIST_PACKAGE_COPY } from '../constants/folder.js';
import { env_report } from '../presentation/env_report.js';
import { package_report } from '../presentation/package_report.js';
import { Config } from '../utils/config.js';
import { read_json } from '../utils/file.js';
import { Cwd } from '../vars/cwd.js';

export const build_command = async () => {
    const check_env_report = await check_env();
    // execution can end here when environment is not correct
    env_report(check_env_report);
    terminate(!check_env_report || !check_env_report.success);

    //  Build Global(storage) Data
    // @TODO
    //  Collect packages
    const package_json = read_json('package.json');
    const { available_packages, disabled_packages } = await collect_packages(package_json);
    package_report(available_packages, disabled_packages);
    //  Initialize Plugins
    // @TODO
    //  Copy static files from packages
    //  Copy files from packages and override in the package order
    const package_tree = {};
    available_packages.forEach((pkg) => {
        copy_folder(pkg.path, FOLDER_LIST_PACKAGE_COPY, join(Cwd.get(), FOLDER_GEN), (file) => {
            package_tree[file.target] = pkg;
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

    //  Build Tree of files and packages
    // @TODO
    //  Execute Routes
    // @TODO
    //  Transform Svelte files to client and server components
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
