import { dirname, join } from 'path';
import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { exists, find_file, to_extension } from './file.js';
import { to_relative_path } from './to.js';
import { replace_src } from './transform.js';
import { filled_array, filled_object, filled_string, is_array, is_null } from './validate.js';
import { uniq_values } from './uniq.js';

export function dependencies_from_content(content, file) {
    if (!filled_string(content) || !filled_string(file)) {
        return undefined;
    }
    const cwd = Cwd.get();
    let file_path = dirname(file);
    // prepand absolute path when it is relative
    if (file_path.indexOf('/') != 0) {
        file_path = join(cwd, file_path);
    }
    const deps = {};
    const dep_key = to_relative_path(file);
    content.replace(/import .*? from ["']([^"']+)["'];?/g, (match, dep) => {
        if (is_null(deps[dep_key])) {
            deps[dep_key] = [];
        }
        // node dependency
        if (dep.indexOf('./') != 0 && dep.indexOf('/') != 0 && dep.indexOf('@src') != 0) {
            return;
        }
        // replace @src
        dep = replace_src(dep, '');
        const dep_file_path = join(Cwd.get(), FOLDER_GEN_SRC, dep);
        let dep_file;
        if (exists(dep_file_path)) {
            dep_file = dep_file_path;
        }
        // search for the file
        if (is_null(dep_file)) {
            dep_file = find_file(
                file_path,
                ['svelte', 'js', 'mjs', 'cjs', 'ts'].map((ext) => to_extension(dep, ext))
            );
        }
        if (dep_file) {
            dep_file = to_relative_path(dep_file.replace(cwd, '.'));
            deps[dep_key].push(dep_file);
        }
        return;
    });

    // clear empty dependencies
    if (!filled_array(deps[dep_key])) {
        return undefined;
    }

    return deps;
}
export function flip_dependency_tree(dependencies) {
    if (!filled_object(dependencies)) {
        return undefined;
    }
    const result = {};
    Object.keys(dependencies).forEach((parent) => {
        dependencies[parent].forEach((child) => {
            if (!is_array(result[child])) {
                result[child] = [];
            }
            result[child].push(parent);
        });
    });
    return result;
}
export function get_dependencies(tree, file) {
    if (!filled_object(tree) || is_null(tree[file])) {
        return [];
    }
    const result = tree[file];
    tree[file].forEach((child) => {
        result.push(...get_dependencies(tree, child));
    });
    return uniq_values(result);
}
