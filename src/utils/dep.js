import { dirname, extname, join } from 'node:path';
import { FOLDER_GEN_SRC, FOLDER_STORAGE } from '../constants/folder.js';
import { extract_wyvr_file_config } from '../model/wyvr_file.js';
import { Cwd } from '../vars/cwd.js';
import { Database } from './database/database.js';
import {
    filled_array,
    filled_object,
    filled_string,
    is_array,
    is_null,
} from './validate.js';
import { to_relative_path_of_gen } from './to.js';
import { replace_src } from './transform.js';
import { exists, find_file, to_extension } from './file.js';
import { WyvrFileConfig } from '../struc/wyvr_file.js';
import { parse } from './json.js';

let db;
const table = 'list';
export function clear_dependencies() {
    init();
    if (db) {
        
        db = undefined;
    }
    init();
}
function init() {
    if (db) {
        return true;
    }
    db = new Database(Cwd.get(FOLDER_STORAGE, 'dependency.db'));
    if (!db) {
        return false;
    }
    db.create(table, {
        file: { type: 'TEXT', primary: true, null: false, unique: true },
        children: { type: 'TEXT', null: true },
        root: { type: 'TEXT', null: true },
        standalone: { type: 'TEXT', null: true },
    });
    return true;
}

export function update_file(file, childs, config) {
    if (!init()) {
        return false;
    }
    if (!filled_string(file)) {
        return false;
    }
    if (config?.render !== undefined && !filled_string(config?.render)) {
        return false;
    }
    const children = JSON.stringify(is_array(childs) ? childs : []);
    const root = [
        'src/doc/',
        'src/layout/',
        'src/page/',
        'routes/',
        'cron/',
        'commands/',
        'plugins/',
        'pages/',
    ]
        .find((key) => file.indexOf(key) === 0)
        ?.replace('src/', '')
        .replace('/', '');

    // console.log(file, root, children);

    return db.run(
        `INSERT OR REPLACE INTO ${table} (file, children, root, standalone) VALUES (?, ?, ?, ?);`,
        [file, children, root, render]
    );
}

export function parse_content(content, file) {
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
    const ext = extname(file);
    const deps = [];
    const i18n = {};
    const config =
        ext === '.svelte'
            ? extract_wyvr_file_config(content) ??
              structuredClone(WyvrFileConfig)
            : undefined;
    const rel_path = to_relative_path_of_gen(file);
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
    if (entry.standalone === 'hydrate') {
        return [entry.file];
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

export function get_index() {
    if (!init()) {
        return undefined;
    }
    const result = db.getAll(`SELECT * FROM "${table}"`);
    if (!filled_array(result)) {
        return undefined;
    }
    const index = {};
    for (const entry of result) {
        if (!entry.file) {
            continue;
        }
        let children = [];
        if (filled_string(entry.children) && entry.children !== '[]') {
            children = parse(entry.children);
        }
        index[entry.file] = { ...entry, children };
    }
    return index;
}
