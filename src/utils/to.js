import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    FOLDER_GEN,
    FOLDER_GEN_CLIENT,
    FOLDER_GEN_SERVER,
    FOLDER_GEN_SRC,
    FOLDER_SERVER,
    FOLDER_SRC,
} from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { to_extension } from './file.js';
import {
    is_object,
    is_array,
    is_null,
    filled_string,
    is_regex,
    is_symbol,
    is_big_int,
    is_string,
    filled_array,
    filled_object,
} from './validate.js';

export function to_string(value) {
    if (is_null(value)) {
        return `${value}`;
    }
    if (is_object(value) || is_array(value)) {
        return JSON.stringify(value);
    }
    return value.toString();
}

export function to_snake_case(value) {
    if (!filled_string(value)) {
        return undefined;
    }
    return value
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/^_/, '')
        .replace(/_+/g, '_');
}
export function to_escaped(value) {
    if (is_symbol(value) || is_regex(value)) {
        value = to_string(value);
    }
    if (is_big_int(value)) {
        return to_string(value);
    }
    if (value === undefined) {
        return 'undefined';
    }
    return JSON.stringify(value).replace(/'/g, "''");
}
export function to_plain(text) {
    if (!is_string(text)) {
        return '';
    }
    // @see https://github.com/doowb/ansi-colors/blob/master/index.js ANSI_REGEX
    // biome-ignore lint/suspicious/noControlCharactersInRegex: <explanation>
    return text.replace(
        /[\u001b\u009b][[\]#;?()]*(?:(?:(?:[^\W_]*;?[^\W_]*)\u0007)|(?:(?:[0-9]{1,4}(;[0-9]{0,4})*)?[~0-9=<>cf-nqrtyA-PRZ]))/g,
        ''
    );
}

export function to_dirname(import_meta_url) {
    return join(dirname(resolve(join(fileURLToPath(import_meta_url)))));
}
function replace_path(path, replace_with) {
    if (!filled_string(path) || !filled_string(replace_with)) {
        return '';
    }
    // replace src with server folder
    if (path.indexOf(FOLDER_GEN_SRC) > -1) {
        return path.replace(FOLDER_GEN_SRC, replace_with);
    }
    // check if the cwd is inside the path
    const cwd = Cwd.get();
    if (path.indexOf(cwd) > -1) {
        return path.replace(cwd, join(cwd, replace_with));
    }
    return path;
}
/**
 * Converts the given path to a relative path inside the first child of gen
 * @param {string} path
 * @returns
 */
export function to_relative_path(path) {
    if (!filled_string(path)) {
        return '';
    }
    let splitted = path.split('/');
    const gen_index = splitted.indexOf(FOLDER_GEN);
    const src_index = splitted.indexOf(FOLDER_SRC);
    if (gen_index > -1 || src_index > -1) {
        // gen and the next child or when only src is inside the path
        const index = Math.max(gen_index + 1, src_index);
        splitted = splitted.slice(index + 1);
    }

    return splitted.join('/').replace(ReleasePath.get(), '');
}
/**
 * Converts the given path to a relative path of gen
 * @param {string} path
 * @returns
 */
export function to_relative_path_of_gen(path) {
    if (!filled_string(path)) {
        return '';
    }
    return to_relative_from_markers(path, FOLDER_GEN).replace(
        ReleasePath.get(),
        ''
    );
}
/**
 * Converts the given path to a relative path of the given marker folders
 * @param {string} path
 * @returns
 */
export function to_relative_from_markers(path, ...markers) {
    if (!filled_string(path)) {
        return '';
    }
    let parts = path.split('/');
    const max_index = parts.length - 1;
    const index = Math.max(
        ...markers.map((marker) => {
            const index = parts.indexOf(marker);
            if (index === max_index) {
                return -1;
            }
            return index;
        })
    );
    if (index > -1) {
        parts = parts.slice(index + 1);
    }
    return parts.join('/');
}
/**
 * Converts the given path to gen/server path and convert svelte files to js
 * @param {string} path
 * @returns
 */
export function to_server_path(path) {
    const mod_path = replace_path(path, FOLDER_GEN_SERVER);
    if (extname(mod_path) !== '.svelte') {
        return mod_path;
    }
    return to_extension(mod_path, 'js');
}
export function to_client_path(path) {
    return replace_path(path, FOLDER_GEN_CLIENT);
}
export function to_svelte_paths(data) {
    if (filled_string(data)) {
        return [to_extension(data, 'svelte')];
    }
    if (filled_array(data)) {
        return data.map((file) => to_extension(file, 'svelte'));
    }
    return undefined;
}
export function to_identifier_name(...parts) {
    const default_sign = 'default';
    if (!filled_array(parts)) {
        return default_sign;
    }
    const identifiers = parts.map(to_single_identifier_name);
    // empty or all default identifiers gets combined into one
    if (
        !filled_array(identifiers) ||
        identifiers.filter((part) => part !== default_sign).length === 0
    ) {
        return default_sign;
    }
    const combined = identifiers.join('-');
    return combined;
}
export function to_single_identifier_name(part) {
    const internal_part = !filled_string(part) ? 'default' : part;
    let normalized_part = to_relative_from_markers(
        internal_part.replace(/\.[^.]+$/, '').toLowerCase(),
        FOLDER_GEN_SERVER,
        FOLDER_SERVER
    );

    return normalized_part
        .replace(/^\/?(doc|layout|page)\//, '')
        .replace(/\/|-/g, '_');
}
/**
 * Combine identifiers into one object
 * @param  {...{ identifier: string, doc: string, layout: string, page:string }} items
 * @returns
 */
export function to_identifiers(...items) {
    const identifiers = {};
    for (const obj of items) {
        if (!filled_object(obj)) {
            continue;
        }
        for (const key of Object.keys(obj)) {
            identifiers[key] = obj[key];
        }
    }
    return identifiers;
}

export function to_tabbed(content, tabsize = 4, prefix = '') {
    if (!is_array(content)) {
        return '';
    }
    const tab = new Array(tabsize).fill(' ').join('');
    return content
        .map((line) => {
            if (!is_array(line)) {
                return prefix + line.toString();
            }
            return to_tabbed(line, tabsize, prefix + tab);
        })
        .join('\n');
}
