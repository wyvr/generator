import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { FOLDER_GEN_CLIENT, FOLDER_GEN_SERVER, FOLDER_GEN_SRC } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
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
export function to_server_path(path) {
    return replace_path(path, FOLDER_GEN_SERVER);
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
    const identifiers = parts
        .filter((x) => x)
        .map((part) => {
            const normalized_part = part.replace(/\.svelte$/, '').toLowerCase();
            const index = normalized_part.indexOf(FOLDER_GEN_SERVER);
            if (index < 0) {
                return normalized_part;
            }
            return normalized_part.substring(index + FOLDER_GEN_SERVER.length).replace(/^\/(doc|layout|page)\//, '');
        })
        .map((part) => part.replace(/\//g, '_'));
    // empty or all default identifiers gets combined into one
    if (!filled_array(identifiers) || identifiers.filter((part) => part != default_sign).length == 0) {
        return default_sign;
    }
    const combined = identifiers.join('-');
    return combined;
}
