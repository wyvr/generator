import { FOLDER_CACHE } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { Config } from './config.js';
import { read_json, write_json } from './file.js';
import { filled_string, is_null } from './validate.js';

export function get_config_cache(segment, fallback_value) {
    if (!filled_string(segment)) {
        return fallback_value;
    }
    let value = Config.get(segment);
    const path = get_config_cache_path(segment);
    if (!is_null(value)) {
        return value;
    }
    const cache = read_json(path);
    if (is_null(cache)) {
        return fallback_value;
    }
    Config.set(segment, cache);
    return Config.get(segment, fallback_value);
}

export function set_config_cache(segment, value) {
    if (!filled_string(segment)) {
        return;
    }
    const path = get_config_cache_path(segment);
    Config.set(segment, value);
    write_json(path, value);
}

export function get_config_cache_path(segment) {
    if (!filled_string(segment)) {
        return undefined;
    }
    const main = segment.replace(/\./g, '_');
    return Cwd.get(FOLDER_CACHE, `${main}.json`);
}
