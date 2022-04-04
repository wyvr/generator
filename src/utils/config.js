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
    return merge(config1, config2);
}

function config() {
    let cache;

    return {
        get: (segment, fallback_value) => {
            // fill cache when empty
            if (!cache) {
                cache = merge_config(WyvrConfig, {});
            }
            // when nothing is specified as segment return whole config
            if (!is_string(segment)) {
                return cache;
            }
            return search_segment(cache, segment, fallback_value);
        },
        set: () => {},
        replace: () => {},
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
                return {};
            } catch (e) {
                Logger.warning(e);
                return {};
            }
        },
    };
}

export const Config = config();
