import { Logger } from '@lib/logger';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { mkdirSync, existsSync, writeFileSync } from 'fs-extra';
import { Dir } from './dir';
import { dirname } from 'path';
import merge from 'deepmerge';

export class Storage {
    static is_setup: boolean = false;
    static db: Database = null;

    /**
     * Create database when not existing
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
            filename: 'cache/storage.db',
            driver: sqlite3.Database,
        });
        // tables
        await this.db.exec(`CREATE TABLE IF NOT EXISTS global (
            key VARCHAR(255) NOT NULL PRIMARY KEY,
            value TEXT
        );`);
        await this.db.exec(`CREATE TABLE IF NOT EXISTS nav (
            key VARCHAR(255) NOT NULL PRIMARY KEY,
            value TEXT
        );`);
        // nav has to be empty
        const [nav_clear_error] = await this.clear('nav');
        if(nav_clear_error) {
            console.log(nav_clear_error)
        }
    }
    static async get(table: string, key: string, fallback: any = null): Promise<[Error | null, any]> {
        if (!table || !key) {
            return [null, fallback];
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
                    let result = null;
                    if(step == '*') {
                        result =  await this.db.all(`SELECT key, value FROM ${this.normalize(table)}`);
                        if (result) {
                            return [null, result];
                        }
                        // console.log(result)
                    } else {
                        result = await this.db.get(`SELECT value FROM ${this.normalize(table)} WHERE key = ?`, step);
                    }
                    if (!result || !result.value) {
                        return [null, fallback];
                    }
                    value = JSON.parse(result.value);

                    // when there was an index on the first element, select the item
                    if (value !== undefined && index != null && Array.isArray(value)) {
                        value = value[index];
                    }
                } catch (e) {
                    return [e, null];
                }
                continue;
            }
            // dig deeper in the data
            value = value[step];
            if (value === undefined) {
                return [null, fallback];
            }
            // when index is available dig into the index
            if (value !== undefined && index != null && Array.isArray(value)) {
                value = value[index];
            }
        }

        return [null, value];
    }
    static async set(table: string, key: string, value: any = null): Promise<[Error | null, boolean]> {
        if (!table || !key) {
            return [null, false];
        }
        await this.setup();
        try {
            if (value) {
                // insert or replace entry
                // https://stackoverflow.com/questions/418898/sqlite-upsert-not-insert-or-replace
                const rows = await this.db.run(`INSERT OR REPLACE INTO ${this.normalize(table)} (key, value) VALUES (?, ?);`, key, JSON.stringify(value));
                // console.log(rows)
                return [null, true];
            }
            console.log('DELETE', key)
            // delete when no value is set
            await this.db.run(`DELETE from ${this.normalize(table)} WHERE key = ?;`, key);
            return [null, true];
        } catch (e) {
            console.log(e)
            return [e, false];
        }
    }
    static async merge(table: string, key: string, value: any = null): Promise<[Error | null, boolean]> {
        if (!table || !key || value == null) {
            return [null, false];
        }
        await this.setup();
        const [get_error, orig] = await this.get(table, key);
        if(get_error) {
            return [get_error, null];
        }
        // when orif not exists use the new value
        if (orig == null || typeof value != 'object') {
            return await this.set(table, key, value);
        }
        return await this.set(table, key, merge(orig, value));
    }
    static normalize(text: string = '') {
        return text.replace(/[A-Z]/g, '-$1').toLowerCase().replace(/^-/, '').replace(/-+/g, '-');
    }
    static async clear(table: string): Promise<[Error|null,boolean]> {
        if (!table) {
            return [null, false];
        }
        try {
            // delete when no value is set
            await this.db.run(`DELETE from ${this.normalize(table)};`);
            // remove unused space
            await this.db.run(`VACUUM;`);
            return [null, true];
        } catch (e) {
            return [e, false];
        }
    }
}
