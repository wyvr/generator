import { dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { FOLDER_GEN, FOLDER_GEN_CLIENT, FOLDER_GEN_SERVER, FOLDER_GEN_SRC } from '../constants/folder.js';
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
        return value + '';
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
        .replace(/^_/, '')
        .replace(/[^a-z_]/g, '_')
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
    /* eslint-disable no-control-regex */
    // @see https://github.com/doowb/ansi-colors/blob/master/index.js ANSI_REGEX
    return text.replace(
        /[\u001b\u009b][[\]#;?()]*(?:(?:(?:[^\W_]*;?[^\W_]*)\u0007)|(?:(?:[0-9]{1,4}(;[0-9]{0,4})*)?[~0-9=<>cf-nqrtyA-PRZ]))/g,
        ''
    );
    /* eslint-enable no-control-regex */
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
    const regex = new RegExp(`.+/${FOLDER_GEN}/[^/]+/`);
    return path.replace(regex, '').replace(ReleasePath.get(), '');
}
/**
 * Converts the given path to gen/server path and convert svelte files to js
 * @param {string} path
 * @returns
 */
export function to_server_path(path) {
    const mod_path = replace_path(path, FOLDER_GEN_SERVER);
    if (extname(mod_path) != '.svelte') {
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
    if (!filled_array(identifiers) || identifiers.filter((part) => part != default_sign).length == 0) {
        return default_sign;
    }
    const combined = identifiers.join('-');
    return combined;
}
export function to_single_identifier_name(part) {
    const internal_part = !filled_string(part) ? 'default' : part;
    let normalized_part = internal_part.replace(/\.[^.]+$/, '').toLowerCase();
    const index = normalized_part.indexOf(FOLDER_GEN_SERVER);
    if (index >= 0) {
        normalized_part = normalized_part
            .substring(index + FOLDER_GEN_SERVER.length);
    }

    return normalized_part.replace(/^\/?(doc|layout|page)\//, '').replace(/\/|-/g, '_');
}
/**
 * Combine identifiers into one object
 * @param  {...{ identifier: string, doc: string, layout: string, page:string }} items
 * @returns
 */
export function to_identifiers(...items) {
    const identifiers = {};
    items.forEach((obj) => {
        if (!filled_object(obj)) {
            return;
        }
        Object.keys(obj).forEach((key) => {
            identifiers[key] = obj[key];
        });
    });
    return identifiers;
}
