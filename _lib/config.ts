/* eslint-disable @typescript-eslint/no-explicit-any*/

import * as fs from 'fs';
import { join } from 'path';
import merge from 'deepmerge';
import { Cwd } from '@lib/vars/cwd';
import { IObject } from '@lib/interface/object';

export class Config {
    // cached troughout the whole process
    private static cache = null;
    /**
     * get the config of the path based on the current project
     * @returns the config
     */
    static load_from_path(path = ''): IObject | null {
        const config_path = join(Cwd.get(), path, 'wyvr.js');
        if (fs.existsSync(config_path)) {
            /* eslint-disable @typescript-eslint/no-var-requires */
            const config = require(config_path);
            /* eslint-enable @typescript-eslint/no-var-requires */
            return config;
        }
        return null;
    }
    /**
     * get the config value
     * @example get('path.to.the.config.value')
     * @param config_segment config to get as string, when nothing is given return the whole config
     * @returns the value or undefined
     */
    static get(config_segment: string | null = null): any | undefined {
        if (!this.cache) {
            const local_config = this.load_from_path();
            /* eslint-disable @typescript-eslint/no-var-requires */
            const default_config = require('@config/config');
            /* eslint-enable @typescript-eslint/no-var-requires */
            if (local_config) {
                this.cache = merge(default_config, local_config);
            } else {
                // when no wyvr.js is present in the current project use default config
                this.cache = default_config;
            }
        }
        if (!config_segment || typeof config_segment != 'string') {
            return this.cache;
        }
        // load only the partial config segment
        const splitted_config_segment = config_segment.split('.');
        let shrinked_config = this.cache;
        for (const index in splitted_config_segment) {
            if (!splitted_config_segment[index] || !shrinked_config[splitted_config_segment[index]]) {
                return undefined;
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
    /* eslint-disable @typescript-eslint/no-explicit-any*/
    static set(value: any): boolean {
        if (value) {
            this.cache = merge(this.cache, value);
            return true;
        }
        return false;
    }

    /**
     * replaces the whole config with the given value
     * @param value new config
     * @returns
     */
    static replace(value: any): boolean {
        if (value) {
            this.cache = value;
            return true;
        }
        return false;
    }
    /**
     * merge configs together
     * @param config1 base config
     * @param config2 config with higher priority
     * @returns
     */
    static merge(config1: any, config2: any) {
        return merge(config1, config2);
    }
}