import { dirname, join } from 'path';
import { Cwd } from '../vars/cwd.js';
import { exists, find_file, is_file, to_extension } from './file.js';
import { filled_string, is_null } from './validate.js';

export function dependencies_from_content(content, file) {
    if (!filled_string(content) || !filled_string(file)) {
        return undefined;
    }
    const cwd = Cwd.get();
    let file_path = dirname(file);
    // prepand absolute path when it is relative
    if(file_path.indexOf('/') != 0) {
        file_path = join(cwd, file_path);
    }
    const deps = {};
    content.replace(/import .*? from ["']([^"']+)["'];?/g, (match, dep) => {
        if (is_null(deps[file])) {
            deps[file] = [];
        }
        // node dependency
        if(dep.indexOf('./') != 0) {
            return;
        }
        // used absolute path
        if(exists(dep) && is_file(dep)) {
            deps[file].push(dep);
            return;
        }
        // search for the file
        const dep_file = find_file(file_path, ['js', 'mjs', 'cjs', 'ts'].map((ext)=> to_extension(dep, ext)));
        if(dep_file) {
            deps[file].push(dep_file.replace(cwd, '.'));
            return;
        }
        return;
    });

    return deps;
}
