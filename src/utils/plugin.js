// /* eslint @typescript-eslint/no-explicit-any: 0 */
// /* eslint @typescript-eslint/ban-types: 0 */

import { hrtime } from 'process';
import { join } from 'path';
import { Cwd } from '../vars/cwd.js';
import { get_error_message } from './error.js';
import { collect_files } from './file.js';
import { Logger } from './logger.js';
import { filled_array, filled_string } from './validate.js';
import { nano_to_milli } from './convert.js';

// import { Logger } from '@lib/logger';
// import { join } from 'path';
// import { Error } from '@lib/error';
// import { hrtime_to_ms } from '@lib/converter/time';
// import { Cwd } from '@lib/vars/cwd';

export class Plugin {
    static async load(folder) {
        if (!filled_string(folder)) {
            return undefined;
        }
        const files = collect_files(folder);
        if (!filled_array(files)) {
            return undefined;
        }
        return files;
    }
    static async generate(files) {
        if (!filled_array(files)) {
            return undefined;
        }
        const cwd = Cwd.get();
        const result = {};
        await Promise.all(
            files.map(async (file_path) => {
                let plugin;
                try {
                    plugin = (await import(join(cwd, file_path))).default;
                } catch (e) {
                    Logger.error('error in plugin', file_path, get_error_message(e, file_path, 'plugin'));
                    return undefined;
                }

                Object.keys(plugin).map((name) => {
                    if (!result[name]) {
                        result[name] = {};
                        result[name].before = [];
                        // result[name].around = [];
                        result[name].after = [];
                    }
                    Object.keys(plugin[name]).forEach((type) => {
                        if (['before', 'after', 'around'].indexOf(type) < 0) {
                            Logger.warning('unkown plugin type', type, file_path);
                            return;
                        }

                        result[name][type].push({
                            source: file_path,
                            fn: plugin[name][type],
                        });
                        Logger.debug('add plugin', name, type, 'from', file_path);
                    });
                });
                return null;
            })
        );
        return result;
    }

    static clear() {
        this.cache = {};
    }

    static async before(name, ...args) {
        return (await this.build_listeners(name, 'before'))(...args);
    }
    // static async around(name: string, ...args) {
    //     return (await this.build_listeners(name, 'around'))(...args);
    // }
    static async after(name, ...args) {
        return (await this.build_listeners(name, 'after'))(...args);
    }
    static async build_listeners(name, type) {
        if (!name || !this.cache || !this.cache[name] || !filled_array(this.cache[name][type])) {
            return async (...args) => {
                return [null, this.config, ...args];
            };
        }
        return async (...args) => {
            let result = [null, this.config, ...args];
            const listeners = this.cache[name][type];
            // after plugins gets executed in reversed order
            if (type == 'after') {
                for (let i = listeners.length - 1; i >= 0; i--) {
                    const start = hrtime.bigint();
                    try {
                        const partial_result = await listeners[i].fn(...result);
                        if (partial_result && Array.isArray(partial_result) && partial_result.length >= result.length) {
                            result = partial_result;
                        }
                    } catch (e) {
                        Logger.error(
                            'error in plugin for',
                            Logger.color.bold(name),
                            Logger.color.bold(type),
                            Error.get(e, listeners[i].source, 'plugin')
                        );
                    }
                    const duration = nano_to_milli(hrtime.bigint() - start);
                    Logger.report(duration, 'plugin', name, type, listeners[i].source);
                }
                return result;
            }
            for (let i = 0, len = listeners.length; i < len; i++) {
                try {
                    const partial_result = await listeners[i].fn(...result);
                    if (partial_result && Array.isArray(partial_result) && partial_result.length >= result.length) {
                        result = partial_result;
                    }
                } catch (e) {
                    Logger.error(
                        'error in plugin for',
                        Logger.color.bold(name),
                        Logger.color.bold(type),
                        Error.get(e, listeners[i].source, 'plugin')
                    );
                }
            }
            return result;
        };
    }
}
Plugin.cache = {};
