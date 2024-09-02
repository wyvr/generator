import merge from 'deepmerge';
import { get_error_message } from './error.js';
import { is_file, find_file, write_json, read_json, remove } from './file.js';
import { register_inject } from './global.js';
import { Logger } from './logger.js';
import { search_segment } from './segment.js';
import { filled_object, filled_string, is_array, is_object, is_string } from './validate.js';
import { FOLDER_CACHE } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { append_cache_breaker } from './cache_breaker.js';

// location of the persisted config cache
const config_cache_path = Cwd.get(FOLDER_CACHE, 'config.json');

export function merge_config(config1, config2) {
    if (config1 === undefined && config2 === undefined) {
        return undefined;
    }
    const config = merge(config1 ?? {}, config2 ?? {});
    // avoid merging of the crons
    if(filled_object(config2?.cron)) {
        for(const [key, value] of Object.entries(config2.cron)){
            config.cron[key] = value;
        }
    }
    // correct the packages and assets
    return dedup(config);
}

function dedup(obj) {
    if (is_array(obj)) {
        // Deduplicate array and handle nested objects
        const seen = new Map();
        return obj
            .filter((item) => {
                const serializedItem = JSON.stringify(item);
                return seen.has(serializedItem) ? false : seen.set(serializedItem, true);
            })
            .map(dedup);
    }
    if (is_object(obj)) {
        // Iterate over object properties
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = dedup(obj[key]);
            }
        }
    }
    return obj;
}

function config() {
    let cache;

    return {
        clear: () => {
            remove(config_cache_path);
        },
        get: (segment, fallback_value) => {
            // fill cache when empty
            if (!cache) {
                cache = read_json(config_cache_path) || {};
            }
            // when nothing is specified as segment return whole config
            if (!is_string(segment)) {
                // here should not be used structuredClone
                return Object.assign({}, cache);
            }
            return search_segment(cache, segment, fallback_value);
        },
        set: (segment, value) => {
            if (!cache) {
                cache = read_json(config_cache_path) || {};
            }
            let path = cache;
            const segments = segment.split('.');
            const seg_length = segments.length;
            segments.forEach((segment, index) => {
                // create structure
                if (path[segment] === undefined) {
                    path[segment] = {};
                }
                // set the value for the last segment
                if (index === seg_length - 1) {
                    path[segment] = value;
                }
                // use new path as path
                path = path[segment];
            });
        },
        replace: (new_config) => {
            // when value is undefined the next get sets the value again
            cache = new_config;
        },
        merge: merge_config,
        load: async (path) => {
            if (!is_string(path)) {
                return {};
            }
            const filepath = get_config_path(path);
            if (!filepath) {
                return {};
            }
            try {
                const result = await import(append_cache_breaker(filepath));
                if (result?.default) {
                    return result.default;
                }
            } catch (e) {
                Logger.error(get_error_message(e, filepath, 'config'));
            }
            return {};
        },
        persist: () => {
            if (!filled_object(cache)) {
                return;
            }
            write_json(config_cache_path, cache);
        }
    };
}

export const Config = config();

export async function inject(content, file) {
    if (!filled_string(content)) {
        return '';
    }
    const search_string = '_inject(';
    const found = content.match(new RegExp(`\\W${search_string.replace('(', '\\(')}`));
    // when not found or part of another word
    if (!found) {
        return content;
    }
    const start_index = found.index + 1;
    let index = start_index + search_string.length + 1;
    let open_brackets = 1;
    let found_closing = false;
    const length = content.length;
    while (index < length && open_brackets > 0) {
        const char = content[index];
        switch (char) {
            case '(':
                open_brackets++;
                break;
            case ')':
                open_brackets--;
                if (open_brackets === 0) {
                    found_closing = true;
                }
                break;
        }
        index++;
    }
    if (found_closing) {
        // extract the function content, to execute it
        register_inject(file);
        const func_content = content.substr(start_index, index - start_index);
        // biome-ignore lint/security/noGlobalEval: inject has to be evaluated
        const result = await eval(func_content); // @NOTE throw error, must be catched outside

        // insert result of getGlobal
        const replaced = content.substr(0, start_index) + JSON.stringify(result) + content.substr(index);
        // check if more onServer handlers are used
        return await inject(replaced);
    }
    return content;
}

export function get_config_path(path) {
    const filepath = find_file(path, ['wyvr.js', 'wyvr.mjs', 'wyvr.cjs']);
    if (!is_file(filepath)) {
        return undefined;
    }
    return filepath;
}
