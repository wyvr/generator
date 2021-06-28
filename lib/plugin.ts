import { Logger } from '@lib/logger';
import fs from 'fs';
import { join } from 'path';
import { Error } from '@lib/error';

export class Plugin {
    static cache: any = {};
    static config: any = null;
    static async init(plugin_files: string[], config: any) {
        Logger.info('found', plugin_files.length, 'plugins');
        this.config = config;
        await Promise.all(
            plugin_files.map(async (file_path) => {
                let plugin = null;
                try {
                    plugin = require(join(process.cwd(), file_path));
                } catch (e) {
                    Logger.error('error in plugin', file_path, Error.get(e, file_path, 'plugin'));
                    return null;
                }

                Object.keys(plugin).map((name) => {
                    if (!this.cache[name]) {
                        this.cache[name] = {};
                        this.cache[name][PluginType.before] = [];
                        this.cache[name][PluginType.around] = [];
                        this.cache[name][PluginType.after] = [];
                    }
                    Object.keys(plugin[name]).forEach((type) => {
                        const plugin_type = PluginType[PluginType[type]];
                        if (!plugin[name][plugin_type]) {
                            Logger.warning('unkown plugin type', type, file_path);
                            return;
                        }

                        this.cache[name][PluginType[type]].push({
                            source: file_path,
                            fn: plugin[name][plugin_type],
                        });
                        Logger.debug('add plugin', name, type, 'from', file_path);
                    });
                });
                return null;
            })
        );
    }
    static clear() {
        this.cache = {};
    }

    static async before(name: string, ...args) {
        return (await this.build_listeners(name, PluginType.before))(...args);
    }
    static async around(name: string, ...args) {
        return (await this.build_listeners(name, PluginType.around))(...args);
    }
    static async after(name: string, ...args) {
        return (await this.build_listeners(name, PluginType.after))(...args);
    }
    static async build_listeners(name: string, type: PluginType, ...args): Promise<Function> {
        if (!name || !this.cache || !this.cache[name] || !this.cache[name][type] || this.cache[name][type].length == 0) {
            return async (...args) => {
                return [null, this.config, ...args];
            };
        }
        return async (...args) => {
            let result = [null, this.config, ...args];
            const listeners = this.cache[name][type];
            // after plugins gets executed in reversed order
            if (type == PluginType.after) {
                for (let i = listeners.length - 1; i >= 0; i--) {
                    try {
                        const partial_result = await listeners[i].fn(...result);
                        if (partial_result && Array.isArray(partial_result) && partial_result.length >= result.length) {
                            result = partial_result;
                        }
                    } catch (e) {
                        Logger.error(
                            'error in plugin for',
                            Logger.color.bold(name),
                            Logger.color.bold(PluginType[type]),
                            Error.get(e, listeners[i].source, 'plugin')
                        );
                    }
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
                        Logger.color.bold(PluginType[type]),
                        Error.get(e, listeners[i].source, 'plugin')
                    );
                }
            }
            return result;
        };
    }
    static register(name: string, type: PluginType, fn: Function) {}
    static register_before(name: string, fn: Function) {
        this.register(name, PluginType.before, fn);
    }
    static register_around(name: string, fn: Function) {
        this.register(name, PluginType.around, fn);
    }
    static register_after(name: string, fn: Function) {
        this.register(name, PluginType.after, fn);
    }
}
export enum PluginType {
    before,
    around,
    after,
}
