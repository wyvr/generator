//const wyvr_config = (await import('../wyvr.js')).default;
import merge from 'deepmerge';
import { join } from 'path';
import { WyvrConfig } from '../model/wyvr_config.js';
import { is_file } from './file.js';
import { register_inject } from './global.js';
import { Logger } from './logger.js';
import { search_segment } from './segment.js';
import { filled_string, is_string } from './validate.js';

// function get() {}
// function set() {}
// function replace() {}
function merge_config(config1, config2) {
    if (config1 === undefined && config2 === undefined) {
        return undefined;
    }
    if (config1 === undefined) {
        config1 = {};
    }
    if (config2 === undefined) {
        config2 = {};
    }

    return merge(config1, config2);
}

function config() {
    let cache;

    return {
        get: (segment, fallback_value) => {
            // fill cache when empty
            if (!cache) {
                cache = Object.assign({}, WyvrConfig);
            }
            // when nothing is specified as segment return whole config
            if (!is_string(segment)) {
                return Object.assign({}, cache);
            }
            return search_segment(cache, segment, fallback_value);
        },
        set: (segment, value) => {
            if (!cache) {
                cache = Object.assign({}, WyvrConfig);
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
                if (index == seg_length - 1) {
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
            const filepah = join(path, 'wyvr.js');
            if (!is_file(filepah)) {
                return {};
            }
            try {
                const result = await import(filepah);
                if (result && result.default) {
                    return result.default;
                }
            } catch (e) {
                Logger.warning('can not load config from', filepah, e);
            }
            return {};
        },
    };
}

export const Config = config();

export async function inject(content, file) {
    if(!filled_string(content)) {
        return '';
    }
    const search_string = '_inject(';
    const start_index = content.indexOf(search_string);
    // when not found
    if (start_index == -1) {
        return content;
    }
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
                if (open_brackets == 0) {
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
        const result = await eval(func_content); // @NOTE throw error, must be catched outside

        // insert result of getGlobal
        const replaced = content.substr(0, start_index) + JSON.stringify(result) + content.substr(index);
        // check if more onServer handlers are used
        return await inject(replaced);
    }
    return content;
}
