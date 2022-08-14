import { dirname } from 'path';
import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { exists, find_file, to_extension } from './file.js';
import { to_relative_path } from './to.js';
import { replace_src } from './transform.js';
import { filled_array, filled_object, filled_string, is_array, is_func, is_null } from './validate.js';
import { uniq_values } from './uniq.js';
import { WyvrFileRender } from '../struc/wyvr_file.js';
import { WyvrFile } from '../model/wyvr_file.js';
import { Identifier } from '../model/identifier.js';

export function dependencies_from_content(content, file) {
    if (!filled_string(content) || !filled_string(file)) {
        return undefined;
    }
    let file_path = dirname(file);
    // prepand absolute path when it is relative
    if (file_path.indexOf('/') != 0) {
        file_path = Cwd.get(file_path);
    }
    const deps = {};
    const i18n = {};
    const key = to_relative_path(file);
    content.replace(/import .*? from ["']([^"']+)["'];?/g, (_, dep) => {
        if (is_null(deps[key])) {
            deps[key] = [];
        }
        // node dependency
        if (dep.indexOf('./') != 0 && dep.indexOf('/') != 0 && dep.indexOf('@src') != 0) {
            return;
        }
        // replace @src
        dep = replace_src(dep, '');
        const dep_file_path = Cwd.get(FOLDER_GEN_SRC, dep);
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
            dep_file = to_relative_path(dep_file.replace(Cwd.get(), '.'));
            deps[key].push(dep_file);
        }
        return;
    });

    content.replace(/__\(["']([^"']*)["']/g, (_, translation) => {
        if (is_null(i18n[key])) {
            i18n[key] = [];
        }
        i18n[key].push(translation);
    });

    // clear empty dependencies
    if (!filled_array(deps[key])) {
        return { dependencies: undefined, i18n };
    }

    return { dependencies: deps, i18n };
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
export function get_dependencies(tree, file, callback) {
    if (!filled_object(tree) || is_null(tree[file])) {
        return [];
    }
    if (!is_func(callback)) {
        callback = (list) => list;
    }
    const result = callback(tree[file], file);
    tree[file].forEach((child) => {
        result.push(...get_dependencies(tree, child, callback));
    });
    return uniq_values(result);
}

export function get_hydrate_dependencies(tree, file_config_tree, file) {
    if (!filled_object(tree) || !filled_object(file_config_tree) || is_null(file_config_tree[file])) {
        return [];
    }
    const result = [];
    const config = file_config_tree[file];
    if (config.render == WyvrFileRender.hydrate) {
        const entry = WyvrFile(file);
        entry.config = file_config_tree[file];
        return [entry];
    }
    if (!is_null(tree[file])) {
        tree[file].forEach((child) => {
            result.push(...get_hydrate_dependencies(tree, file_config_tree, child));
        });
    }
    return result;
}

export function get_translations_of_dependencies(tree, i18n, file) {
    if (!filled_object(tree) || !filled_object(i18n)) {
        return [];
    }
    const translations = i18n[file] || [];
    if (!is_null(tree[file])) {
        tree[file].forEach((child) => {
            translations.push(...get_translations_of_dependencies(tree, i18n, child));
        });
    }
    return translations;
}

export function get_identifiers_of_file(reversed_tree, file) {
    const parents = { doc: [], layout: [], page: [] };
    if (!reversed_tree || !filled_string(file)) {
        return { identifiers_of_file: parents, files: [] };
    }
    const lists = get_parents_of_file_recursive(reversed_tree, file);
    if (is_null(lists)) {
        return { identifiers_of_file: parents, files: [] };
    }
    let has_values = false;
    const files = uniq_values([file].concat(...lists.filter((x) => x)));

    files
        .filter((x) => x)
        .forEach((file) => {
            if (file.indexOf('doc/') == 0) {
                parents.doc.push(file);
                has_values = true;
            }
            if (file.indexOf('layout/') == 0) {
                parents.layout.push(file);
                has_values = true;
            }
            if (file.indexOf('page/') == 0) {
                parents.page.push(file);
                has_values = true;
            }
        });
    if (!has_values) {
        return { identifiers_of_file: parents, files };
    }
    if (!filled_array(parents.doc)) {
        parents.doc.push(undefined);
    }
    if (!filled_array(parents.layout)) {
        parents.layout.push(undefined);
    }
    if (!filled_array(parents.page)) {
        parents.page.push(undefined);
    }
    const identifiers = [];
    parents.doc.forEach((doc) => {
        parents.layout.forEach((layout) => {
            parents.page.forEach((page) => {
                identifiers.push(Identifier(doc, layout, page));
            });
        });
    });
    return { identifiers_of_file: uniq_values(identifiers), files };
}
function get_parents_of_file_recursive(tree, file) {
    if (!tree[file]) {
        return undefined;
    }
    const parents = tree[file];
    parents.push(...tree[file].map((parent) => get_parents_of_file_recursive(tree, parent)));
    return parents;
}
