import { FOLDER_STORAGE } from '../../constants/folder.js';
import { Cwd } from '../../vars/cwd.js';
import { filled_object, filled_string } from '../validate.js';
import { Database } from './database.js';

export class KeyValue {
    /**
     * Create a key value store
     * @param {string} name name of the database and table, to store multiple tables use / as separator e.g. `<file_name>/<table_name>`
     * @param {string|null} path absolute path where the database should be stored
     * @returns
     */
    constructor(name, path) {
        if (!filled_string(name)) {
            return;
        }
        const parts = name.split('/');
        this.table = parts.pop();
        if (!this.table) {
            return;
        }
        // if absolute path is provided, use it
        if (filled_string(path)) {
            this.file = path;
        } else {
            // when the name contains / this splits the file name from the table name
            if (parts.length > 0) {
                this.file = Cwd.get(FOLDER_STORAGE, `${parts.join('/')}.db`);
            } else {
                this.file = Cwd.get(FOLDER_STORAGE, `${name}.db`);
            }
        }
        if (this.db) {
            return;
        }

        this.db = new Database(this.file);
        if (!this.db) {
            return;
        }

        this.db.create(this.table, {
            key: { type: 'TEXT', primary: true, null: false },
            value: { type: 'TEXT' },
        });
    }

    get(key) {
        if (!this.db) {
            return undefined;
        }
        const result = this.db.getFirst(
            `SELECT value FROM ${this.table} WHERE key = ?;`,
            [key]
        );
        if (!result?.value) {
            return undefined;
        }
        try {
            return JSON.parse(result.value);
        } catch (e) {
            return undefined;
        }
    }
    all() {
        if (!this.db) {
            return undefined;
        }
        const result = this.db.getAll(`SELECT * FROM ${this.table};`);
        return Object.fromEntries(
            result?.map(({ key, value }) => [key, JSON.parse(value)])
        );
    }

    set(key, value) {
        if (!this.db) {
            return undefined;
        }
        return this.db.run(
            `INSERT OR REPLACE INTO ${this.table} (key, value) VALUES (?, ?);`,
            [key, JSON.stringify(value)]
        );
    }
    keys() {
        if (!this.db) {
            return undefined;
        }
        return this.db
            .getAll(`SELECT key FROM ${this.table};`)
            ?.map((entry) => entry?.key);
    }
    close() {
        if (!this.db) {
            return undefined;
        }
        this.db.close();
    }
    clear() {
        if (!this.db) {
            return undefined;
        }
        // delete entries from database && remove unused space
        this.db.run(`DELETE FROM ${this.table};`);
        this.db.run('VACUUM;');
    }
    setObject(obj) {
        if (!this.db) {
            return undefined;
        }
        if (!filled_object(obj)) {
            return false;
        }
        for (const key of Object.keys(obj)) {
            this.set(key, obj[key]);
        }
    }
}
