import { Logger } from '@lib/logger';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { mkdirSync, existsSync, writeFileSync } from 'fs-extra';
import { Dir } from './dir';
import { dirname } from 'path';
import merge from 'deepmerge';

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
                    return await this.get_global(key, fallback || null, callback);
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
    static async get_global(key: string, fallback: any = null, callback: Function = null) {
        if (!key) {
            return Global.apply_callback(fallback, callback);
        }
        // avoid loading to much data
        if (key == 'nav' && (!callback || typeof callback != 'function')) {
            Logger.error('[wyvr]', 'avoid getting getGlobal("nav") because of potential memory leak, add a callback to shrink results');
            return Global.apply_callback(fallback, callback);
        }
        await this.setup();
        const steps = key.split('.');

        // set safety fallback
        let value = fallback;

        for (let i = 0; i < steps.length; i++) {
            let step = steps[i];
            let index = null;
            // searches an element at an specific index
            if (step.indexOf('[') > -1 && step.indexOf(']') > -1) {
                const match = step.match(/^([^\[]+)\[([^\]]+)\]$/);
                if (match) {
                    step = match[1];
                    index = parseInt((match[2] + '').trim(), 10);
                }
            }
            // first step is the key in the db
            if (i == 0) {
                try {
                    const result = await this.db.get('SELECT value FROM global WHERE key = ?', step);
                    if (!result || !result.value) {
                        return await Global.apply_callback(fallback, callback);
                    }
                    value = JSON.parse(result.value);

                    // when there was an index on the first element, select the item
                    if (value !== undefined && index != null && Array.isArray(value)) {
                        value = value[index];
                    }
                } catch (e) {
                    console.log(key, e);
                    return await Global.apply_callback(fallback, callback);
                }
                continue;
            }
            // dig deeper in the data
            value = value[step];
            if (value === undefined) {
                return Global.apply_callback(fallback, callback);
            }
            // when index is available dig into the index
            if (value !== undefined && index != null && Array.isArray(value)) {
                value = value[index];
            }
        }

        return await Global.apply_callback(value, callback);
    }
    /**
     * Create global database when not existing
     * @returns void
     */
    static async setup() {
        if (this.db) {
            return;
        }
        // create the folder otherwise sqlite can not create file
        if (!existsSync('cache')) {
            mkdirSync('cache');
        }
        // save and store the connection
        this.db = await open({
            filename: 'cache/global.db',
            driver: sqlite3.Database,
        });
        await this.db.exec(`CREATE TABLE IF NOT EXISTS global (
            key TEXT PRIMARY KEY,
            value TEXT
        );`);
    }
    static async set_global(key: string, value: any = null): Promise<boolean> {
        if (!key) {
            return false;
        }
        await this.setup();
        try {
            if (value) {
                // insert or replace entry
                // https://stackoverflow.com/questions/418898/sqlite-upsert-not-insert-or-replace
                await this.db.run(`INSERT OR REPLACE INTO global (key, value) VALUES (?, ?);`, key, JSON.stringify(value));
                return true;
            }
            // delete when no value is set
            await this.db.run(`DELETE from global WHERE key = ?;`, key);
            return true;
            // await this.db.run('UPDATE global SET value = ? WHERE key = ?', JSON.stringify(value), key);
        } catch (e) {
            console.log(e);
            return false;
        }
    }
    static async merge_global(key: string, value: any = null): Promise<boolean> {
        if (!key || value == null) {
            return false;
        }
        await this.setup();
        const orig = await this.get_global(key);
        // when orif not exists use the new value
        if (orig == null || typeof value != 'object') {
            return await this.set_global(key, value);
        }
        return await this.set_global(key, merge(orig, value));
    }
    static async set_global_all(data) {
        // @NOTE maybe this is slow, can be changed into a prepared statement or a hugh insert statement
        await Promise.all(
            Object.keys(data).map(async (key) => {
                return await this.set_global(key, data[key]);
            })
        );
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
            const data = null;
            Dir.create(dirname(filepath));
            // write global data to release
            writeFileSync(filepath, JSON.stringify(data));
        }
    }
}
