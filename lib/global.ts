import { Logger } from '@lib/logger';
import { open, Database } from 'sqlite';
import { mkdirSync, existsSync, writeFileSync } from 'fs-extra';
import { Dir } from './dir';
import { dirname } from 'path';
import merge from 'deepmerge';
import { Storage } from '@lib/storage';
import { v4 } from 'uuid';


export class Global {
    static is_setup: boolean = false;
    static db: Database = null;
    /**
     * Replace the getGlobal() method and insert the result
     * @param content svelte content
     * @returns the content with inserted getGlobal result
     */
    static async replace_global(content: string): Promise<string> {
        if (!content || typeof content != 'string') {
            return '';
        }
        const search_string = 'getGlobal(';
        let start_index = content.indexOf(search_string);
        // when not found
        if (start_index == -1) {
            return content;
        }
        let index = start_index + search_string.length + 1;
        let open_brackets = 1;
        let found_closing = false;
        const length = content.length;
        while (index < length && open_brackets > 0) {
            const char = content[index];
            switch (char) {
                case '(':
                    open_brackets++;
                    break;
                case ')':
                    open_brackets--;
                    if (open_brackets == 0) {
                        found_closing = true;
                    }
                    break;
            }
            index++;
        }
        if (found_closing) {
            // extract the function content, to execute it
            const func_content = content.substr(start_index, index - start_index);
            if (!(<any>global).getGlobal || typeof (<any>global).getGlobal != 'function') {
                (<any>global).getGlobal = async (key, fallback, callback) => {
                    const value = await this.get(key, fallback === undefined ? null : fallback, callback);
                    console.log('replace', key, value);
                    return value;
                };
            }
            let result = await eval(func_content); // @NOTE throw error, must be catched outside

            // insert result of getGlobal
            const replaced = content.substr(0, start_index) + JSON.stringify(result) + content.substr(index);
            // check if more onServer handlers are used
            return await this.replace_global(replaced);
        }
        return content;
    }
    /**
     * get the value from the global_data
     * @param key the key path which should be get from global
     * @param fallback fallback value when the key path does not exist or global_data is not existing
     * @param callback when defined a method to transform the given data
     * @returns json string of the result
     */
    static async get(key: string, fallback: any = null, callback: Function = null) {
        if (!key) {
            return this.apply_callback(fallback, callback);
        }
        const [table, corrected_key] = this.correct(key);
        // corrected_key can here not be an array
        if (typeof corrected_key == 'string') {
            // console.log(table, corrected_key)
            const [get_error, result] = await Storage.get(table, corrected_key, fallback);
            if (get_error) {
                console.log(get_error);
                return this.apply_callback(fallback, callback);
            }
            return this.apply_callback(result, callback);
        }
        return this.apply_callback(fallback, callback);
    }

    static async set(key: string, value: any = null): Promise<boolean> {
        if (!key) {
            return false;
        }
        const [table, corrected_key] = this.correct(key, value);
        let set_error: Error | null = null,
            result = false;
        if (Array.isArray(corrected_key)) {
            const all_result = await Promise.all(
                corrected_key.map(async (key) => {
                    return await Storage.merge(table, key, value[key]);
                })
            );
            set_error = all_result.reduce((acc: Error | null, cur): Error | null => {
                if (cur[0]) {
                    return cur[0];
                }
                return acc;
            }, null);
            result = all_result.reduce((acc: boolean, cur): boolean => {
                if (!cur[1]) {
                    return false;
                }
                return acc;
            }, true);
        } else {
            console.log('set', table, corrected_key);
            [set_error, result] = await Storage.set(table, corrected_key, value);
            console.log('set done', table, corrected_key)
        }
        if (set_error) {
            console.log(set_error);
            return false;
        }
        return result;
    }
    static async set_all(data) {
        // @NOTE maybe this is slow, can be changed into a prepared statement or a hugh insert statement
        return await Promise.all(
            Object.keys(data).map(async (key) => {
                return await this.set(key, data[key]);
            })
        );
    }
    static async merge(key: string, value: any = null): Promise<boolean> {
        if (!key || value == null) {
            return false;
        }
        const orig = await this.get(key);
        // when original not exists use the new value
        if (orig == null || typeof value != 'object') {
            return await this.set(key, value);
        }
        let merged = merge(orig, value);
        const [table, corrected_key] = this.correct(key);
        if (table == 'navigation' && Array.isArray(merged)) {
            const urls = [];
            merged = merged.filter((entry) => {
                if (urls.indexOf(entry.url) > -1) {
                    return false;
                }
                urls.push(entry.url);
                return true;
            });
        }
        // if(Array.isArray(corrected_key)) {
        //     const result = await (await Promise.all(corrected_key.map(async (key)=> {
        //         return await this.set(corrected_key, merged);
        //     }))).reduce()
        // }
        return await this.set(key, merged);
    }
    static async merge_all(data) {
        const id = v4().split('-')[0];
        console.log('merge start', id, Object.keys(data.navigation))
        // @NOTE maybe this is slow, can be changed into a prepared statement or a hugh insert statement
        const result = await Promise.all(
            Object.keys(data).map(async (key) => {
                if (!Array.isArray(data[key]) && typeof data[key] == 'object') {
                    return await Promise.all(Object.keys(data[key]).map(async (sub_key) => {
                        return await this.merge(`${key}.${sub_key}`, data[key][sub_key]);
                    }));
                }
                return await this.merge(key, data[key]);
            })
        );
        console.log('merge done', id)
        return result;
    }
    /**
     * When callback is defined it gets applied to the given value
     * @param value value which can be transformed
     * @param callback when defined a method to transform the given data
     * @returns the transformed value
     */
    static async apply_callback(value: any, callback: Function = null) {
        if (!value || !callback || typeof callback != 'function') {
            return value;
        }
        try {
            return await callback(value);
        } catch (e) {
            return value;
        }
    }
    static async export(filepath: string) {
        if (filepath) {
            const data = {};
            await Promise.all(
                (
                    await Storage.tables()
                ).map(async (table) => {
                    const result = await Storage.get(table, '*', null);
                    if (table == 'global') {
                        Object.keys(result).forEach((key) => {
                            data[key] = result[key];
                        });
                        return null;
                    }
                    data[table] = result;
                })
            );
            Dir.create(dirname(filepath));
            // write global data to release
            writeFileSync(filepath, JSON.stringify(data));
        }
    }
    static correct(key: string, value: any = null): [string, string | string[]] {
        if (!key) {
            return ['global', '*'];
        }

        const splitted_key = key.split('.');
        const first_key = splitted_key.shift();

        const table = first_key;
        let corrected_key: string | string[] = splitted_key.join('.');

        if (!corrected_key) {
            corrected_key = '*';
            // use the keys from the value to extract keys
            if (value && typeof value == 'object') {
                corrected_key = Object.keys(value);
            }
        }

        return [table, corrected_key];
    }
}
