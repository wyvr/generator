import { dirname, extname, join } from 'node:path';
import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { extract_wyvr_file_config, WyvrFile } from '../model/wyvr_file.js';
import { Cwd } from '../vars/cwd.js';
import { filled_array, filled_object, filled_string, in_array, is_null } from './validate.js';
import { to_relative_path_of_gen } from './to.js';
import { replace_src } from './transform.js';
import { exists, find_file, to_extension } from './file.js';
import { WyvrFileConfig, WyvrFileRender } from '../struc/wyvr_file.js';
import { uniq_values } from './uniq.js';
import { Identifier } from '../model/identifier.js';

export function parse_content(content, file) {
    if (!filled_string(content) || !filled_string(file)) {
        return undefined;
    }
    let file_path = file;
    // prepand absolute path when it is relative
    if (file_path.indexOf('/') !== 0) {
        file_path = Cwd.get(file_path);
    }
    // convert to directory of the file
    const file_dir_path = dirname(file_path);

    // paths are relative to the src folder

    const rel_path_file = file_path.replace(Cwd.get(), '');
    const rel_base_path = dirname(rel_path_file);
    const ext = extname(file);
    const deps = [];
    const i18n = {};
    const config = ext === '.svelte' ? extract_wyvr_file_config(content) ?? structuredClone(WyvrFileConfig) : undefined;
    const rel_path = to_relative_path_of_gen(rel_path_file.replace(/^\//, ''));
    content.replace(/import .*? from ["']([^"']+)["'];?/g, (_, dep) => {
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
        const dep_file_path_with_src = Cwd.get(FOLDER_GEN_SRC, to_relative_path_of_gen(dep).replace(/^\/?(?:server|src|client)\//, ''));
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
                file_dir_path,
                ['svelte', 'js', 'mjs', 'cjs', 'ts'].map((ext) => to_extension(dep, ext))
            );
        }
        if (dep_file) {
            dep_file = to_relative_path_of_gen(dep_file.replace(Cwd.get(), '.')).replace(/^server\//, 'src/');
            // avoid self assigning as children
            if (dep_file !== rel_path) {
                deps.push(dep_file);
            }
        }
        return;
    });

    // @TODO currently disabled
    // content.replace(/__\(["']([^"']*)["']/g, (_, translation) => {
    //     if (is_null(i18n[key])) {
    //         i18n[key] = [];
    //     }
    //     i18n[key].push(translation);
    // });

    return { dependencies: deps, i18n, rel_path, config };
}
export function get_render_dependencies(file, index) {
    if (!filled_string(file) || !filled_object(index)) {
        return [];
    }
    const entry = index[file];
    if (!entry) {
        return [];
    }
    // do not search deeper when the file is renderable
    if ([WyvrFileRender.hydrate, WyvrFileRender.request, WyvrFileRender.hydrequest].indexOf(entry.standalone) >= 0) {
        return [entry];
    }
    if (!entry.children) {
        return [];
    }
    const list = [];
    for (const child of entry.children) {
        list.push(...get_render_dependencies(child, index));
    }
    return list;
}

export function get_render_dependency_wyvr_files(file, index) {
    const entries = get_render_dependencies(file, index);
    return entries.map((entry) => {
        const w_file = WyvrFile(entry.file);
        w_file.config = entry.config;
        return w_file;
    });
}

export function get_parents_of_file(file, inverted_index) {
    if (!filled_string(file) || !filled_object(inverted_index)) {
        return [];
    }
    const entry = inverted_index[file];
    if (!entry) {
        return [];
    }
    const result = [entry];
    if (!entry.parents) {
        return result;
    }
    for (const parent of entry.parents) {
        result.push(...get_parents_of_file(parent, inverted_index));
    }
    return result;
}

export function get_identifiers_of_list(list) {
    if (!filled_array(list)) {
        return [];
    }
    const parents = { doc: [], layout: [], page: [] };
    const identifiers = [];
    const types = ['doc', 'layout', 'page'];
    for (const entry of list) {
        if (in_array(types, entry.root)) {
            parents[entry.root].push(entry.file);
        }
    }
    // add undefined as representation of the default template
    for (const type of types) {
        if (!filled_array(parents[type])) {
            parents[type].push(undefined);
        } else {
            parents[type] = uniq_values(parents[type]);
        }
    }

    // create all possible combinations
    for (const doc of parents.doc) {
        for (const layout of parents.layout) {
            for (const page of parents.page) {
                identifiers.push(Identifier(doc, layout, page));
            }
        }
    }
    return uniq_values(identifiers);
}
