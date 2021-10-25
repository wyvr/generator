import { Config } from '@lib/config';
import { join, sep } from 'path';
import { existsSync, copySync } from 'fs-extra';
import { File } from '@lib/file';
import { Logger } from '@lib/logger';

export const copy_static_files = (cwd: string, package_tree) => {
    const packages = Config.get('packages');
    if (packages) {
        packages.forEach((pkg) => {
            // copy the files from the package to the project
            ['assets', 'routes', 'plugins'].forEach((part) => {
                if (existsSync(join(pkg.path, part))) {
                    // store the info which file comes from which package
                    const pkg_part_path = join(pkg.path, part);
                    File.collect_files(pkg_part_path)
                        .map((file) => file.replace(pkg.path + sep, ''))
                        .forEach((file) => {
                            package_tree[file] = pkg;
                        });
                    copySync(join(pkg.path, part), join(cwd, 'gen', part));
                }
            });
        });
    }
    // copy configured assets into release
    const assets = Config.get('assets');
    if (assets) {
        assets.forEach((entry) => {
            if (entry.src && existsSync(entry.src)) {
                const target = join(cwd, 'gen/assets', entry.target);
                Logger.debug('copy asset from', entry.src, 'to', target);
                copySync(entry.src, target);
            } else {
                Logger.warning('can not copy asset', entry.src, 'empty or not existing');
            }
        });
    }
    return package_tree;
};
