//const wyvr_config = (await import('../wyvr.js')).default;
import merge from 'deepmerge';
import { WyvrConfig } from '../model/wyvr_config.js';
import { search_segment } from './segment.js';
import { is_string } from './validate.js';

async function load_wyvr_config(path) {
    return undefined;
}
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
    };
}

export const Config = config();
