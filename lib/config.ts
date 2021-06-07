import * as fs from 'fs';
import { join } from 'path';
import merge from 'deepmerge';

export class Config {
    // cached troughout the whole process
    private static cache = null;
    /**
     * get the local config of the project
     * @returns the local config
     */
    static load_from_local() {
        const local_config_path = join(process.cwd(), 'wyvr.js');
        if (fs.existsSync(local_config_path)) {
            const config = require(local_config_path);
            return config;
        }
        return null;
    }
    /**
     * get the config value
     * @example get('path.to.the.config.value')
     * @param config_segment config to get as string, when nothing is given return the whole config
     * @returns the value or null
     */
    static get(config_segment: string | null = null): any | null {
        if (!this.cache) {
            const local_config = this.load_from_local();
            const default_config = require('@config/config');
            if(local_config) {
                this.cache = merge(default_config, local_config);
            } else {
                this.cache = default_config;
            }
        }
        if (!config_segment || typeof config_segment != 'string') {
            return this.cache;
        }
        // load only the partial config segment
        const splitted_config_segment = config_segment.split('.');
        let shrinked_config = this.cache;
        for (let index in splitted_config_segment) {
            if (!splitted_config_segment[index] || !shrinked_config[splitted_config_segment[index]]) {
                return null;
            }
            shrinked_config = shrinked_config[splitted_config_segment[index]];
        }
        return shrinked_config;
    }
    /**
     * allow changing of the config
     * @param value object structure to replace the current config with
     * @returns 
     */
    static set(value: any) {
        if(value) {
            this.cache = merge(this.cache, value);
            return true;
        }
        return false;
    }
}
