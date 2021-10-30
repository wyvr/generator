import { Config } from '@lib/config';
import { Dir } from '@lib/dir';
import { Plugin } from '@lib/plugin';
import { File } from '@lib/file';
import { join, sep } from 'path';
import { existsSync, copySync } from 'fs-extra';
import { Cwd } from '@lib/vars/cwd';
import { IPackageTree } from '@lib/interface/package_tree';

export const collect = async (package_tree: IPackageTree) => {
    const cwd = Cwd.get();
    const packages = Config.get('packages');
    await Plugin.before('collect', packages);
    if (packages) {
        Dir.create('gen/raw');
        packages.forEach((pkg) => {
            // copy the files from the package to the project gen/raw
            ['src'].forEach((part) => {
                if (existsSync(join(pkg.path, part))) {
                    // store the info which file comes from which package
                    const pkg_part_path = join(pkg.path, part);
                    File.collect_files(pkg_part_path)
                        .map((file) => file.replace(pkg.path + sep, ''))
                        .forEach((file) => {
                            package_tree[file] = pkg;
                        });
                    copySync(join(pkg.path, part), join(cwd, 'gen/raw'));
                }
            });
        });
    }
    await Plugin.after('collect', packages);
    return package_tree;
};
