//const wyvr_config = (await import('../wyvr.js')).default;
import merge from 'deepmerge';
import { join } from 'path';
import { WyvrConfig } from '../model/wyvr_config.js';
import { is_file } from './file.js';
import { Logger } from './logger.js';
import { search_segment } from './segment.js';
import { is_string } from './validate.js';

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
                cache = WyvrConfig;
            }
            // when nothing is specified as segment return whole config
            if (!is_string(segment)) {
                return cache;
            }
            return search_segment(cache, segment, fallback_value);
        },
        set: (segment, value) => {
            if (!cache) {
                cache = WyvrConfig;
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
