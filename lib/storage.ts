/* eslint @typescript-eslint/no-explicit-any: 0 */

import { Logger } from '@lib/logger';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import merge from 'deepmerge';
import { File } from '@lib/file';

export class Storage {
    static is_setup = false;
    static db: Database = null;
    static readonly source = 'cache/storage.db';

    /**
     * Create database when not existing
     * @returns void
     */
    static async setup() {
        if (this.db) {
            return false;
        }
        // create the folder otherwise sqlite can not create file
        File.create_dir(this.source);
        try {
            // save and store the connection
            this.db = await open({
                filename: this.source,
                driver: sqlite3.Database,
            });
        } catch (error) {
            Logger.error(error);
            return false;
        }
        // tables
        await this.db.exec(`CREATE TABLE IF NOT EXISTS global (
            key VARCHAR(255) NOT NULL PRIMARY KEY,
            value TEXT
        );`);
        await this.db.exec(`CREATE TABLE IF NOT EXISTS navigation (
            key VARCHAR(255) NOT NULL PRIMARY KEY,
            value TEXT
        );`);
        await this.db.exec(`CREATE TABLE IF NOT EXISTS nav (
            key VARCHAR(255) NOT NULL PRIMARY KEY,
            value TEXT
        );`);
        // nav has to be empty
        const [nav_clear_error] = await this.clear('nav');
        if (nav_clear_error) {
            Logger.error(nav_clear_error);
        }
        return true;
    }
    static async tables() {
        if (!this.db) {
            return [];
        }
        const result = await this.db.all(
            `SELECT name FROM sqlite_master WHERE type ='table' AND name NOT LIKE 'sqlite_%';`
        );
        if (result && Array.isArray(result)) {
            return result.map((table) => table.name);
        }
        return [];
    }
    static async get(
        table: string,
        key: string,
        fallback: any = null
    ): Promise<[Error | null, any]> {
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
                const match = step.match(/^([^[]+)\[([^\]]+)\]$/);
                if (match) {
                    step = match[1];
                    index = parseInt((match[2] + '').trim(), 10);
                }
            }
            // first step is the key in the db
            if (i == 0) {
                try {
                    let result = null;
                    if (step == '*') {
                        result = await this.db.all(
                            `SELECT key, value FROM ${this.normalize(table)}`
                        );
                        if (result) {
                            return [
                                null,
                                result.map((entry) => {
                                    return {
                                        key: entry.key,
                                        value: JSON.parse(entry.value),
                                    };
                                }),
                            ];
                        }
                        // console.log(result)
                    } else {
                        result = await this.db.get(
                            `SELECT value FROM ${this.normalize(
                                table
                            )} WHERE key = ?`,
                            step
                        );
                    }
                    if (!result || !result.value) {
                        return [null, fallback];
                    }
                    value = JSON.parse(result.value);

                    // when there was an index on the first element, select the item
                    if (
                        value !== undefined &&
                        index != null &&
                        Array.isArray(value)
                    ) {
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
    static async set(
        table: string,
        key: string,
        value: any = null
    ): Promise<[Error | null, boolean]> {
        if (!table || !key) {
            return [null, false];
        }
        await this.setup();
        try {
            if (value) {
                // insert or replace entry
                // https://stackoverflow.com/questions/418898/sqlite-upsert-not-insert-or-replace
                await this.db.run(
                    `INSERT OR REPLACE INTO ${this.normalize(
                        table
                    )} (key, value) VALUES (?, ?);`,
                    key,
                    this.escape(value)
                );
                return [null, true];
            }
            // delete when no value is set
            await this.db.run(
                `DELETE from ${this.normalize(table)} WHERE key = ?;`,
                key
            );
            return [null, true];
        } catch (e) {
            Logger.debug(e);
            return [e, false];
        }
    }
    static async insert(
        table: string,
        key: string,
        value: any = null
    ): Promise<[Error | null, boolean]> {
        if (!table || !key || value == undefined) {
            return [null, false];
        }
        await this.setup();
        try {
            await this.db.run(
                `INSERT INTO ${this.normalize(
                    table
                )} (key, value) VALUES (?, ?);`,
                key,
                this.escape(value)
            );
            return [null, true];
        } catch (e) {
            Logger.debug(e);
            return [e, false];
        }
    }
    static escape(value: any) {
        return JSON.stringify(value).replace(/'/g, "''");
    }
    static async update(
        table: string,
        key: string,
        value: any = null
    ): Promise<[Error | null, boolean]> {
        if (!table || !key || value == undefined) {
            return [null, false];
        }
        await this.setup();
        try {
            await this.db.run(
                `UPDATE ${this.normalize(table)} SET value=? WHERE key=?;`,
                this.escape(value),
                key
            );
            return [null, true];
        } catch (e) {
            Logger.debug(e);
            return [e, false];
        }
    }
    static async delete(
        table: string,
        key: string
    ): Promise<[Error | null, boolean]> {
        if (!table || !key) {
            return [null, false];
        }
        await this.setup();
        try {
            await this.db.run(
                `DELETE from ${this.normalize(table)} WHERE key = ?;`,
                key
            );
            return [null, true];
        } catch (e) {
            Logger.debug(e);
            return [e, false];
        }
    }
    static async merge(
        table: string,
        key: string,
        value: any = null
    ): Promise<[Error | null, boolean]> {
        if (!table || !key || value == null) {
            return [null, false];
        }
        await this.setup();
        const [get_error, orig] = await this.get(table, key);
        if (get_error) {
            return [get_error, null];
        }
        // when not exists use the new value
        if (orig == null) {
            const result = await this.insert(table, key, value);
            return result;
        }
        let merged_value = merge(orig, value);
        // avoid multiplying of the navigatin entries
        if (table == 'navigation' && Array.isArray(merged_value)) {
            merged_value = merged_value.filter((item, index, arr) => {
                return arr.findIndex((i) => i.url == item.url) == index;
            });
            // console.log(key, merged_value);
        }
        const result = await this.update(table, key, merged_value);
        return result;
    }
    static async merge_all(
        table: string,
        data: any = null
    ): Promise<[Error | null, boolean]> {
        return await this.set_all(table, data, undefined, (prev, value) => {
            if (typeof value == 'object') {
                return merge(prev, value);
            }
            return value;
        });
    }
    static async set_all(
        table: string,
        data: any = null,
        before_insert: (prev, value) => any = null,
        before_update: (prev, value) => any = null
    ): Promise<[Error | null, boolean]> {
        if (!table || data == null) {
            return [null, false];
        }
        await this.setup();

        const [get_error, all] = await this.get(table, '*');
        if (get_error) {
            return [get_error, null];
        }
        const insert = [],
            update = [];
        // check what should be inserted and what should be updated
        Object.keys(data).forEach((key) => {
            const orig = all.find((item) => item.key == key);
            let value = data[key];
            if (orig) {
                if (before_update && typeof before_update == 'function') {
                    value = before_update(orig.value, value);
                }
                update.push({ key, value: this.escape(value) });
                return;
            }
            if (before_insert && typeof before_insert == 'function') {
                value = before_insert(orig.value, value);
            }
            insert.push({ key, value: this.escape(value) });
        });

        const insert_query =
            insert.length > 0
                ? `INSERT INTO ${this.normalize(
                      table
                  )} (key, value) VALUES ${insert
                      .map((item) => `('${item.key}','${item.value}')`)
                      .join(',')};`
                : '';
        const update_query =
            update.length > 0
                ? update
                      .map(
                          (item) =>
                              `UPDATE ${this.normalize(table)} SET value='${
                                  item.value
                              }' WHERE key='${item.key}';`
                      )
                      .join('')
                : '';
        const query = insert_query + update_query;
        try {
            await this.db.run(query);
        } catch (e) {
            return [e, false];
        }

        return [null, true];
    }
    static normalize(text = '') {
        return text
            .replace(/[A-Z]/g, '-$1')
            .toLowerCase()
            .replace(/^-/, '')
            .replace(/-+/g, '-');
    }
    static async clear(table: string): Promise<[Error | null, boolean]> {
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
    static destroy() {
        this.db = null;
        return File.remove(this.source);
    }
}
