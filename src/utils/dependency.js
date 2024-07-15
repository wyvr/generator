import { dirname, extname, join } from 'node:path';
import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { exists, find_file, to_extension } from './file.js';
import { to_relative_path_of_gen } from './to.js';
import { replace_src } from './transform.js';
import {
    filled_array,
    filled_object,
    filled_string,
    is_array,
    is_func,
    is_null,
} from './validate.js';
import { Logger } from './logger.js';
import { uniq_values } from './uniq.js';
import { WyvrFileRender } from '../struc/wyvr_file.js';
import { WyvrFile } from '../model/wyvr_file.js';
import { Identifier } from '../model/identifier.js';
import { get_error_message } from './error.js';
import { set_config_cache } from './config_cache.js';

export function dependencies_from_content(content, file) {
    if (!filled_string(content) || !filled_string(file)) {
        return undefined;
    }
    let file_path = dirname(file);
    // prepand absolute path when it is relative
    if (file_path.indexOf('/') !== 0) {
        file_path = Cwd.get(file_path);
    }
    // paths are relative to the src folder
    const rel_base_path = file_path
        .replace(Cwd.get(), '')
        .replace(/^\/?src/, '');
    const deps = {};
    const i18n = {};
    const key = to_relative_path_of_gen(file);
    content.replace(/import .*? from ["']([^"']+)["'];?/g, (_, dep) => {
        if (is_null(deps[key])) {
            deps[key] = [];
        }
        // remove cache breaker
        dep = dep.replace(/\?\d+$/, '');
        // node dependency
        if (
            dep.indexOf('./') !== 0 &&
            dep.indexOf('/') !== 0 &&
            dep.indexOf('$src') !== 0 &&
            dep.indexOf('@src') !== 0 // @deprecated
        ) {
            return;
        }
        // replace $src
        dep = replace_src(dep, '');
        // fix relative paths of the dependencies
        // './multiply.js' in folder 'local/src/test/import' must become '/test/import/multiply.js'
        if (dep.indexOf('./') === 0) {
            dep = join(rel_base_path, dep);
        }
        const dep_file_path_with_src = Cwd.get(FOLDER_GEN_SRC, dep);
        let dep_file;
        if (exists(dep_file_path_with_src)) {
            dep_file = dep_file_path_with_src;
        } else {
            if (dep[0] === '/' && extname(dep) && exists(dep)) {
                dep_file = dep;
            }
        }
        // search for the file
        if (is_null(dep_file)) {
            dep_file = find_file(
                file_path,
                ['svelte', 'js', 'mjs', 'cjs', 'ts'].map((ext) =>
                    to_extension(dep, ext)
                )
            );
        }
        if (dep_file) {
            dep_file = to_relative_path_of_gen(
                dep_file.replace(Cwd.get(), '.')
            );
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
    for (const parent of Object.keys(dependencies)) {
        for (const child of dependencies[parent]) {
            if (!is_array(result[child])) {
                result[child] = [];
            }
            result[child].push(parent);
        }
    }
    return result;
}
export function get_dependencies(tree, file, callback) {
    if (!filled_object(tree) || is_null(tree[file])) {
        return [];
    }
    const fn = is_func(callback) ? callback : (list) => list;
    const result = fn(tree[file], file);
    for (const child of tree[file]) {
        result.push(...get_dependencies(tree, child, callback));
    }
    return uniq_values(result);
}

export function get_hydrate_dependencies(tree, file_config_tree, file) {
    if (
        !filled_object(tree) ||
        !filled_object(file_config_tree) ||
        is_null(file_config_tree[file])
    ) {
        return [];
    }
    const result = [];
    const config = file_config_tree[file];
    if (config.render === WyvrFileRender.hydrate) {
        const entry = WyvrFile(file);
        entry.config = file_config_tree[file];
        return [entry];
    }
    if (!is_null(tree[file])) {
        for (const child of tree[file]) {
            if (child !== file) {
                result.push(
                    ...get_hydrate_dependencies(tree, file_config_tree, child)
                );
            }
        }
    }
    return result;
}

export function get_identifiers_of_file(reversed_tree, file) {
    const parents = { doc: [], layout: [], page: [] };
    if (!reversed_tree || !filled_string(file)) {
        return { identifiers_of_file: [], files: [] };
    }
    let lists = undefined;
    try {
        lists = get_parents_of_file_recursive(reversed_tree, file);
        /* c8 ignore start */
    } catch (e) {
        Logger.error(get_error_message(e, file, 'dependency'));
        /* c8 ignore end */
    }
    if (is_null(lists)) {
        return { identifiers_of_file: [], files: [file] };
    }
    let has_values = false;
    const files = uniq_values([file].concat(...lists)).filter((x) => x);

    const get_push_value = (file, path) => {
        const index = file.indexOf(path);
        if (index !== 0) {
            return undefined;
        }
        has_values = true;
        return file.substring(index + path.length);
    };

    for (const file of files) {
        for (const type of ['doc', 'layout', 'page']) {
            const value = get_push_value(file, `src/${type}/`);
            if (value) {
                parents[type].push(value);
            }
        }
    }
    if (!has_values) {
        return { identifiers_of_file: [], files };
    }
    // clean empty arrays
    for (const type of ['doc', 'layout', 'page']) {
        if (!filled_array(parents[type])) {
            parents[type].push(undefined);
        }
    }
    const identifiers = [];
    for (const doc of parents.doc) {
        for (const layout of parents.layout) {
            for (const page of parents.page) {
                identifiers.push(Identifier(doc, layout, page));
            }
        }
    }
    return { identifiers_of_file: uniq_values(identifiers), files };
}

export function get_parents_of_file_recursive(tree, file) {
    // @TODO quickfix if the file is a array
    if (is_array(file)) {
        if (file.length > 1) {
            Logger.error(
                'file is an array and has more then one entries',
                file,
                tree
            );
        }
        // use only first entry
        file = file[0];
    }
    // @TODO buggy when the parent directly is the file
    if (!tree[file]) {
        // try search for the file if it is a doc, layout or page
        const type = file.split('/').find((part) => part && part !== 'src');
        if (type && ['doc', 'layout', 'page'].indexOf(type) > -1) {
            return [file];
        }
        return undefined;
    }
    const parents = [...tree[file]];
    try {
        // Maximum call stack size exceeded can easily occure here
        const found_parents = tree[file]
            .map((parent) => get_parents_of_file_recursive(tree, parent))
            .filter(Boolean);
        parents.push(...found_parents);
    } catch (e) {
        /* c8 ignore start */
        Logger.error(get_error_message(e, file, 'dependency'));
    }
    /* c8 ignore end */

    return parents.flat(8);
}

/**
 * Caches the given dependencies to disk
 * @param {object} dependencies
 * @returns {(object|undefined)}
 */
export function cache_dependencies(dependencies) {
    if (typeof dependencies !== 'object') {
        return undefined;
    }
    const files = Object.keys(dependencies);
    if (files.length === 0) {
        return undefined;
    }
    // remove doubled dependencies
    for (const file of files) {
        dependencies[file] = uniq_values(dependencies[file].flat(2)).map(
            (filepath) => {
                // fix server content when selecting from routes, plugins or events
                return filepath.replace(/^(server|client)\//, 'src/');
            }
        );
    }

    // @NOTE set_config_cache is asynchronous, so this step could be problematic in edge cases
    set_config_cache('dependencies.top', dependencies);

    set_config_cache('dependencies.bottom', flip_dependency_tree(dependencies));

    return dependencies;
}
