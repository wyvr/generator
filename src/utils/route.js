import { basename, extname, join } from 'path';
import { FOLDER_GEN_ROUTES } from '../constants/folder.js';
import { Route } from '../model/route.js';
import { Cwd } from '../vars/cwd.js';
import { collect_files, exists } from './file.js';

export function collect_routes(dir, package_tree) {
    if (!dir) {
        dir = join(Cwd.get(), FOLDER_GEN_ROUTES);
    }
    if (!exists(dir)) {
        return [];
    }
    const result = collect_files(dir)
        .filter((file) => {
            const file_name = basename(file);
            const extension = extname(file_name);
            // files starting with a _ are no routes, these are helper files
            // allow only specific file extensions as routes
            if (file_name.match(/^_/) || ['.js', '.ts', '.md'].indexOf(extension) < 0) {
                return false;
            }
            return true;
        })
        .map((file) => {
            const data = {
                path: file,
                rel_path: file.replace(/.*?\/routes\//, 'routes/')
            };
            // try apply package
            if(package_tree) {
                data.pkg = package_tree[data.rel_path];
            }
            return new Route(data);
        });
    return result;
}
