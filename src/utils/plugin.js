// /* eslint @typescript-eslint/no-explicit-any: 0 */
// /* eslint @typescript-eslint/ban-types: 0 */

import { hrtime } from 'node:process';
import { join } from 'node:path';
import { Cwd } from '../vars/cwd.js';
import { get_error_message } from './error.js';
import { collect_files } from './file.js';
import { Logger } from './logger.js';
import { filled_array, filled_string, in_array, is_func, is_null } from './validate.js';
import { nano_to_milli } from './convert.js';
import { search_segment } from './segment.js';
import { ReleasePath } from '../vars/release_path.js';
import { Env } from '../vars/env.js';
import { FOLDER_GEN_PLUGINS } from '../constants/folder.js';
import { set_config_cache } from './config_cache.js';
import { append_cache_breaker } from './cache_breaker.js';

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
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
                    plugin = (await import(join(cwd, append_cache_breaker(file_path)))).default;
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
                        if (!in_array(['before', 'after', 'around'], type)) {
                            Logger.warning('unkown plugin type', type, file_path);
                            return;
                        }

                        result[name][type].push({
                            source: file_path,
                            fn: plugin[name][type]
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
        return await (await this.execute(name, 'before'))(undefined, ...args);
    }
    static async after(name, result, ...args) {
        return await (await this.execute(name, 'after'))(result, ...args);
    }

    /**
     * Generator who returns a function which processes the plugin data
     * @param {string} name
     * @param {string} type
     * @returns async function
     */
    static async execute(name, type) {
        if (!filled_string(name) || !filled_string(type)) {
            return async (result) => {
                return {
                    error: 'missing plugin name or type',
                    args: undefined,
                    result
                };
            };
        }
        const plugins = search_segment(this.cache, `${name}.${type}`)?.filter(Boolean);
        if (is_null(plugins)) {
            return async (result, ...args) => {
                return {
                    error: `no ${type} plugin for "${name}" found`,
                    args,
                    result
                };
            };
        }

        // after plugins gets executed in reversed order
        if (type === 'after') {
            plugins.reverse();
        }

        return async (result, ...args) => {
            let data = {
                err: undefined,
                args,
                config: {
                    cwd: Cwd.get(),
                    release_path: ReleasePath.get(),
                    env: Env.name()
                },
                result
            };
            for (let i = 0, len = plugins.length; i < len; i++) {
                const start = hrtime.bigint();
                try {
                    const partial_result = await plugins[i].fn(data);
                    if (partial_result !== undefined) {
                        data.result = partial_result;
                    }
                } catch (e) {
                    Logger.error('error in plugin for', Logger.color.bold(name), Logger.color.bold(type), get_error_message(e, plugins[i].source, 'plugin'));
                }
                const duration = nano_to_milli(hrtime.bigint() - start);
                Logger.report(duration, 'plugin', name, type, plugins[i].source);
            }
            return data;
        };
    }
    static async process(name, ...args) {
        return async (original_function) => {
            const out = {
                error: undefined,
                args,
                result: undefined
            };
            if (!is_func(original_function)) {
                out.error = ['missing plugin function'];
                return out;
            }
            const before = await Plugin.before(name, ...args);

            out.error = [].concat(out.error, before.error);

            const result = await original_function(...args);

            const after = await Plugin.after(name, result, ...args);
            out.error = [].concat(out.error, after.error);

            out.result = after.result;
            out.error = out.error.filter((x) => x !== undefined);
            if (out.error.length == 0) {
                out.error = undefined;
            }
            return out;
        };
    }
    static async initialize() {
        this.clear();
        const plugin_files = await this.load(FOLDER_GEN_PLUGINS);
        const plugins = await this.restore(plugin_files);
        if (plugins) {
            await set_config_cache('plugin_files', plugin_files);
        }
    }
    static async restore(plugin_files) {
        const plugins = await this.generate(plugin_files);
        if (plugins) {
            this.cache = plugins;
        }
        return plugins;
    }
}
Plugin.cache = {};
