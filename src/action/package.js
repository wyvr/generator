import { sep } from 'path';
import { Config } from '../utils/config.js';
import { exists } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { filled_array } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';

export async function collect_packages(package_json) {
    Logger.debug('package.json', package_json);

    // read & validate package.json
    // read packages from wyvr.js
    const root_config = await Config.load(Cwd.get());
    const new_base_config = Config.merge(Config.get(), root_config);
    Config.replace(new_base_config);

    let packages = Config.get('packages');
    const disabled_packages = [];
    const available_packages = [];

    const boilerplate = {
        name: 'wyvr',
        path: Cwd.get('node_modules', '@wyvr', 'generator', 'src', 'boilerplate'),
    };

    if (!filled_array(packages)) {
        packages = [];
    }
    packages.push(boilerplate);

    // iterate over packages
    let packages_config = {};

    await Promise.all(
        packages.map(async (pkg, index) => {
            // process the package
            const proc_pkg = await process_package(pkg, index, package_json);

            // check if the package is outside the node_modules folder
            if (proc_pkg && exists(proc_pkg.pkg.path)) {
                // merge the config
                if (proc_pkg.config) {
                    packages_config = Config.merge(packages_config, proc_pkg.config);
                }
                available_packages[index] = proc_pkg.pkg;
                return index;
            }
            disabled_packages[index] = proc_pkg.pkg;
            return index;
        })
    );
    // update config, but keep the main config values
    const merged_config = Config.merge(packages_config, new_base_config);

    const result = {
        available_packages: available_packages.filter((x) => x),
        disabled_packages: disabled_packages.filter((x) => x),
    };
    // update the packages in the config
    merged_config.packages = result.available_packages;

    Config.replace(merged_config);

    return result;
}

async function process_package(pkg, index, package_json) {
    // set default name for the config and logging
    if (!pkg.name) {
        pkg.name = '#' + index;
    }
    // search inside the node_modules folder
    if (package_json && pkg.name && !pkg.path) {
        const path = Cwd.get('node_modules', pkg.name);
        if (exists(path)) {
            pkg.path = path;
        }
        // search if the package is linked in the package json
        if (!pkg.path) {
            const path = Object.keys(package_json.dependencies || {})
                .map((package_name) => {
                    if (package_name != pkg.name) {
                        return null;
                    }
                    return package_json.dependencies[package_name].match(/file:(.*)/)[1];
                })
                .find((x) => x);
            if (path) {
                pkg.path = path;
            }
        }
    }
    let config = {};
    if (pkg.path) {
        // use absolute path
        if (pkg.path.indexOf(sep) != 0) {
            pkg.path = Cwd.get(pkg.path);
        }
        // load the package config
        config = await Config.load(pkg.path);
    }

    return { pkg, config };
}
