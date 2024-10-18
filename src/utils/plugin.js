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
                    // iterate of the keys
                    for (const type in plugin[name]) {
                        if (!in_array(['before', 'after', 'around'], type)) {
                            Logger.warning('unkown plugin type', type, file_path);
                            continue;
                        }

                        result[name][type].push({
                            source: file_path,
                            fn: plugin[name][type]
                        });
                        Logger.debug('add plugin', name, type, 'from', file_path);
                    }
                });
                return null;
            })
        );
        return result;
    }

    static clear() {
        Plugin.cache = {};
    }

    static async before(name, result) {
        return await (await Plugin.execute(name, 'before'))(result);
    }
    static async after(name, result) {
        return await (await Plugin.execute(name, 'after'))(result);
    }

    /**
     * Generator who returns a function which processes the plugin data
     * @param {string} name
     * @param {string} type
     * @returns async function
     */
    static async execute(name, type) {
        if (!filled_string(name) || !filled_string(type)) {
            Logger.error('missing plugin name or type');
            return async (result) => result;
        }
        const context = {
            cwd: Cwd.get(),
            release_path: ReleasePath.get(),
            env: Env.name()
        };
        const plugins = search_segment(Plugin.cache, `${name}.${type}`)?.filter(Boolean);
        if (is_null(plugins)) {
            return async (result) => result;
        }

        // after plugins gets executed in reversed order
        if (type === 'after') {
            plugins.reverse();
        }

        return async (result) => {
            let final_result = result;
            for (let i = 0, len = plugins.length; i < len; i++) {
                const start = hrtime.bigint();
                try {
                    const partial_result = await plugins[i].fn(final_result, context);
                    if (partial_result !== undefined) {
                        final_result = partial_result;
                    }
                } catch (e) {
                    Logger.error('error in plugin for', Logger.color.bold(name), Logger.color.bold(type), get_error_message(e, plugins[i].source, 'plugin'));
                }
                const duration = nano_to_milli(hrtime.bigint() - start);
                Logger.report(duration, 'plugin', name, type, plugins[i].source);
            }
            return final_result;
        };
    }
    static async process(name, result) {
        let final_result = result;
        return async (original_function) => {
            if (!is_func(original_function)) {
                Logger.warning(`no main function for plugin "${name}"`);
                return final_result;
            }
            final_result = await Plugin.before(name, final_result);

            final_result = await original_function(final_result);

            final_result = await Plugin.after(name, final_result);
            return final_result;
        };
    }
    static async initialize() {
        Plugin.clear();
        const plugin_files = await Plugin.load(FOLDER_GEN_PLUGINS);
        const plugins = await Plugin.restore(plugin_files);
        if (plugins) {
            await set_config_cache('plugin_files', plugin_files);
        }
    }
    static async restore(plugin_files) {
        const plugins = await Plugin.generate(plugin_files);
        if (plugins) {
            Plugin.cache = plugins;
        }
        return plugins;
    }
}
Plugin.cache = {};
