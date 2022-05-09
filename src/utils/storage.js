import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { basename, dirname, join, sep } from 'path';
import { Cwd } from '../vars/cwd.js';
import { filled_array, filled_string, is_null, match_interface } from './validate.js';
import { create_dir, exists, remove, collect_files } from './file.js';
import { to_escaped, to_snake_case } from './to.js';
import { Logger } from './logger.js';
import { StorageCacheStructure, StorageDetailsStructure } from '../struc/storage.js';

export class Storage {
    /**
     * Set the location of the base storage folder
     * @param {string} path
     * @returns {string} location of the storage
     */
    static set_location(path) {
        if (!filled_string(path)) {
            return undefined;
        }
        const location = join(Cwd.get(), path);
        this.location = location;
        return location;
    }

    /**
     * Create the database
     * @param {string} name
     * @param {object} db
     * @returns {boolean} whether the database exists or has been created
     */
    static async create(name, db) {
        if (!match_interface(db, StorageDetailsStructure)) {
            db = this.details(name);
        }
        if (db.exists && db.connected) {
            return true;
        }

        if (!db.exists) {
            create_dir(db.path);
        }
        try {
            // save and store the connection
            this.cache[db.name] = await open({
                filename: db.path,
                driver: sqlite3.Database,
            });

            // tables
            await this.cache[db.name].exec(`CREATE TABLE IF NOT EXISTS "data" (
            key VARCHAR(255) NOT NULL PRIMARY KEY,
            value TEXT
            );`);
            const check = await this.cache[db.name].all(`PRAGMA table_info(data);`);
            if (
                !filled_array(check) ||
                check[0].name !== 'key' ||
                check[0].type !== 'VARCHAR(255)' ||
                check[0].pk !== 1 ||
                check[1].name !== 'value' ||
                check[1].type !== 'TEXT'
            ) {
                Logger.error('the structure of the storage is not correct', check, db);
                return false;
            }
        } catch (error) {
            Logger.error(error, db);
            return false;
        }
        return true;
    }
    /**
     * Opens the connection to the storage and creates it when not existing
     * @param {string} name
     * @returns {object} database details
     */
    static async open(name) {
        let db = this.details(name);

        if (db.exists && db.connected) {
            return db;
        }
        const created = await this.create(name, db);
        if (!created) {
            return undefined;
        }
        return this.details(db.name);
    }
    /**
     * Get details about the given databasename
     * @param {string} name
     * @returns {object} database details
     */
    static details(name) {
        const result = {
            name: undefined,
            path: undefined,
            exists: false,
            connected: false,
        };
        if (!filled_string(name)) {
            return result;
        }
        const db_name = to_snake_case(name);
        const normalized = `${db_name}.db`.replace(/\.db\.db$/, '.db');
        const path = join(this.location, normalized);

        result.name = db_name;
        result.path = path;

        if (exists(path)) {
            result.exists = true;
        }
        // check connect only when file exists
        if (
            result.exists &&
            this.cache &&
            this.cache[db_name] &&
            match_interface(this.cache[db_name], StorageCacheStructure)
        ) {
            result.connected = true;
        }

        return result;
    }
    /**
     * Get all available databases
     * @returns {string[]} available databases
     */
    static get_tables() {
        if (is_null(this.location)) {
            return [];
        }
        const names = collect_files(this.location, '.db')
            .map((database) => {
                // get the name
                const path = database.replace(this.location + sep, '');
                if (dirname(path) != '.') {
                    return undefined;
                }
                return basename(path, '.db');
            })
            .filter((x) => x);
        return names;
    }
    /**
     * Get the value from the database with the given key
     * @param {string} name
     * @param {string} key
     */
    static async get(name, key) {
        if (!filled_string(name) || !filled_string(key)) {
            return undefined;
        }
        const db = await this.open(name);
        try {
            const result = await this.cache[db.name].get('SELECT value FROM "data" WHERE key=?;', key);
            return JSON.parse(result.value);
        } catch (e) {
            Logger.error(e);
        }
        return undefined;
    }
    static async set(name, key_or_data, value) {
        if (!filled_string(name) || is_null(key_or_data)) {
            return false;
        }
        let data = key_or_data;
        if (filled_string(key_or_data)) {
            data = {};
            data[key_or_data] = value;
        }
        const db = await this.open(name);
        if (is_null(db)) {
            return false;
        }
        const results = await Promise.all(
            Object.keys(data).map(async (key) => {
                try {
                    const value = data[key];
                    // delete when value is null
                    if (is_null(value)) {
                        await this.cache[db.name].run('DELETE from "data" WHERE key = ?;', key);
                        return false;
                    }
                    // insert or replace entry
                    // https://stackoverflow.com/questions/418898/sqlite-upsert-not-insert-or-replace
                    await this.cache[db.name].run(
                        'INSERT OR REPLACE INTO "data" (key, value) VALUES (?, ?);',
                        key,
                        to_escaped(value)
                    );
                    return true;
                } catch (e) {
                    Logger.error(e);
                    return undefined;
                }
            })
        );
        // check if at least one value is true or false
        return filled_array(results) && results.find((r) => !is_null(r)) != undefined;
    }
    // static async merge(name, key_or_data, value) {}
    /**
     * Remove the entries in the database
     * @param {string} name
     * @returns
     */
    static async clear(name) {
        if (!filled_string(name)) {
            return false;
        }
        const db = this.details(name);
        if (!db.connected) {
            return false;
        }
        try {
            // delete entries from database && remove unused space
            await this.cache[db.name].run('DELETE FROM "data";VACUUM;');
            return true;
        } catch (e) {
            Logger.error(e);
        }
        return false;
    }
    /**
     * Destroy the database and the connection
     * @param {string} name
     * @returns {boolean} whether the database where deleted or not
     */
    static destroy(name) {
        const db = this.details(name);
        if (is_null(db.name)) {
            return false;
        }
        let removed = db.exists;
        this.cache[db.name] = undefined;
        remove(db.path);
        return removed;
    }
}
Storage.cache = {};