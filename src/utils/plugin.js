// /* eslint @typescript-eslint/no-explicit-any: 0 */
// /* eslint @typescript-eslint/ban-types: 0 */

import { hrtime } from 'process';
import { join } from 'path';
import { Cwd } from '../vars/cwd.js';
import { get_error_message } from './error.js';
import { collect_files } from './file.js';
import { Logger } from './logger.js';
import { filled_array, filled_string, in_array, is_func, is_null, match_interface } from './validate.js';
import { nano_to_milli } from './convert.js';
import { search_segment } from './segment.js';
import { ReleasePath } from '../vars/release_path.js';
import { Env } from '../vars/env.js';

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
                        if (!in_array(['before', 'after', 'around'], type)) {
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
        return await (
            await this.execute(name, 'before')
        )(...args);
    }
    static async after(name, ...args) {
        return await (
            await this.execute(name, 'after')
        )(...args);
    }

    /**
     * Generator who returns a function which processes the plugin data
     * @param {string} name
     * @param {string} type
     * @returns async function
     */
    static async execute(name, type) {
        if (!filled_string(name) || !filled_string(type)) {
            return async () => {
                return {
                    error: 'missing plugin name or type',
                    args: undefined,
                };
            };
        }
        const plugins = search_segment(this.cache, `${name}.${type}`);
        if (is_null(plugins)) {
            return async (...args) => {
                return {
                    error: `no ${type} plugin for "${name}" found`,
                    args,
                };
            };
        }

        // after plugins gets executed in reversed order
        if (type === 'after') {
            plugins.reverse();
        }

        return async (...args) => {
            let result = {
                err: undefined,
                args,
                config: {
                    cwd: Cwd.get(),
                    release_path: ReleasePath.get(),
                    env: Env.name(),
                },
            };
            for (let i = 0, len = plugins.length; i < len; i++) {
                const start = hrtime.bigint();
                try {
                    const partial_result = await plugins[i].fn(result);
                    if (match_interface(partial_result, { args: true, config: true })) {
                        result = partial_result;
                    } else {
                        if (filled_array(partial_result.args)) {
                            result.args = partial_result.args;
                        }
                    }
                } catch (e) {
                    Logger.error(
                        'error in plugin for',
                        Logger.color.bold(name),
                        Logger.color.bold(type),
                        get_error_message(e, plugins[i].source, 'plugin')
                    );
                }
                const duration = nano_to_milli(hrtime.bigint() - start);
                Logger.report(duration, 'plugin', name, type, plugins[i].source);
            }
            return result;
        };
    }
    static async process(name, ...args) {
        return async (original_function) => {
            const out = {
                error: undefined,
                args,
                result: undefined,
            };
            if (!is_func(original_function)) {
                out.error = 'missing plugin function';
                return out;
            }
            await Plugin.before(name, ...args);

            //await WorkerController.process_in_workers(name, data, 100);
            const result = await original_function(...args);

            await Plugin.after(name, ...args);

            out.result = result;
            return out;
        };
    }
}
Plugin.cache = {};
