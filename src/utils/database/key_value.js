import { FOLDER_STORAGE } from '../../constants/folder.js';
import { Cwd } from '../../vars/cwd.js';
import { filled_object, filled_string } from '../validate.js';
import {
    Database,
} from './database.js';

export class KeyValue {
    constructor(name, path) {
        const file = filled_string(path)
            ? path
            : Cwd.get(FOLDER_STORAGE, `${name}.db`);
        this.db = new Database(file);
        if (!this.db) {
            return;
        }
        this.file = file;
        this.db.create('data', {
            key: { type: 'TEXT', primary: true, null: false },
            value: { type: 'TEXT' },
        });
    }

    get(key) {
        if (!this.db) {
            return undefined;
        }
        const result = this.db.getFirst(
            'SELECT value FROM data WHERE key = ?;',
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
        const result = this.db.getAll('SELECT * FROM data;');
        return Object.fromEntries(
            result?.map(({ key, value }) => [key, JSON.parse(value)])
        );
    }

    set(key, value) {
        if (!this.db) {
            return undefined;
        }
        return this.db.run(
            'INSERT OR REPLACE INTO data (key, value) VALUES (?, ?);',
            [key, JSON.stringify(value)]
        );
    }
    keys() {
        if (!this.db) {
            return undefined;
        }
        return this.db
            .getAll('SELECT key FROM data;')
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
        this.db.run('DELETE FROM data;');
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
