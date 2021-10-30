import { Config } from '@lib/config';
import { Error } from '@lib/error';
import { File } from '@lib/file';
import { Logger } from '@lib/logger';
import { join } from 'path';
import { existsSync } from 'fs-extra';
import { IObject } from '@lib/interface/object';
import { IPackage } from '@lib/interface/package';

export const packages = async () => {
    const package_json = File.read_json('package.json');
    if (!package_json) {
        Logger.error(Error.extract({ message: 'parse error' }, 'package.json'));
    }
    const packages: IPackage[] = Config.get('packages');
    const disabled_packages: IPackage[] = [];
    const available_packages: IPackage[] = [];
    if (packages && Array.isArray(packages)) {
        let config: IObject = {};
        // reset the config
        Config.set({ packages: null });
        packages.forEach((pkg, index) => {
            // set default name for the config
            if (!pkg.name) {
                pkg.name = '#' + index;
            }

            // search inside the node_modules folder
            if (package_json && pkg.name && !pkg.path) {
                if (existsSync(join('node_modules', pkg.name))) {
                    pkg.path = join('node_modules', pkg.name);
                }
                // search if the package is linked in the package json
                if (!pkg.path) {
                    pkg.path = Object.keys(package_json.dependencies || {})
                        .map((package_name) => {
                            if (package_name != pkg.name) {
                                return null;
                            }
                            return package_json.dependencies[package_name].match(/file:(.*)/)[1];
                        })
                        .find((x) => x);
                }
            }
            // load the package config
            const package_config = Config.load_from_path(pkg.path);
            if (package_config) {
                config = Config.merge(config, package_config);
            }
            // check if the package is outside the node_modules folder
            if (pkg.path && existsSync(pkg.path)) {
                available_packages.push(pkg);
                return;
            }

            disabled_packages.push(pkg);
        });
        // update config, but keep the main config values
        Config.replace(Config.merge(config, Config.get()));
        // update the packages in the config
        const new_config = { packages: available_packages };
        Logger.debug('update packages', JSON.stringify(new_config));
        Config.set(new_config);
    }
    Logger.present(
        'packages',
        available_packages
            ?.map((pkg) => {
                return `${pkg.name}`;
            })
            .join(', ')
    );
    if (disabled_packages.length) {
        Logger.warning(
            'disabled packages',
            disabled_packages
                .map((pkg) => {
                    return `${pkg.name}${Logger.color.dim('@' + pkg.path)}`;
                })
                .join(' ')
        );
    }

    return packages;
};
