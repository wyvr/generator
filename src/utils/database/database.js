import SQLite from 'better-sqlite3';
import { create_dir, exists } from '../file.js';
import { filled_object, filled_string, is_func } from '../validate.js';
import { Logger } from '../logger.js';
import { get_error_message } from '../error.js';

export class Database {
    constructor(file, onCreate) {
        if (typeof file !== 'string' || file.split('.').pop() !== 'db') {
            return;
        }
        const provision = !exists(file);
        if (provision) {
            create_dir(file);
        }
        const db = new SQLite(file);

        // configure the database
        db.pragma('foreign_keys = ON');
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
        db.pragma('busy_timeout = 5000');
        db.pragma('temp_store = MEMORY');
        db.pragma('mmap_size = 134217728');
        db.pragma('journal_size_limit = 67108864');
        db.pragma('cache_size = 2000');

        // only create the structure if it doesn't exist
        if (!provision && is_func(onCreate)) {
            onCreate(db, file);
        }
        this.db = db;
    }
    create(name, structure) {
        if (!filled_string(name) || !this.db) {
            return undefined;
        }
        const fields = [];
        if (!filled_object(structure)) {
            return undefined;
        }
        for (const key in structure) {
            const config = Object.assign(
                {
                    null: true,
                    type: 'text',
                    primary: false,
                    default: undefined,
                    unique: false
                },
                structure[key]
            );
            fields.push(
                [
                    key,
                    config.type,
                    !config.null ? 'NOT NULL' : '',
                    config.primary ? 'PRIMARY KEY' : '',
                    config.unique ? 'UNIQUE' : '',
                    config.default !== undefined ? `DEFAULT ${config.default}` : ''
                ].join(' ')
            );
        }
        return this.run(`CREATE TABLE IF NOT EXISTS "${name}" (${fields.join(', ')});`);
    }
    close() {
        if (this.db !== undefined) {
            this.db.close();
        }
    }
    clear(name) {
        if (!this.db) {
            return undefined;
        }
        // delete entries from database && remove unused space
        this.run(`DELETE FROM "${name}";`);
        this.run('VACUUM;');
    }

    run(sql, data) {
        return this.#execute('run', sql, data);
    }
    getFirst(sql, data) {
        return this.#execute('get', sql, data);
    }
    getAll(sql, data) {
        return this.#execute('all', sql, data);
    }
    #execute(type, sql, data) {
        if (!this.db) {
            return undefined;
        }
        try {
            const stmt = this.db.prepare(sql);
            if (stmt[type] === undefined) {
                return undefined;
            }
            if (data === undefined) {
                return stmt[type]();
            }
            return stmt[type](data);
        } catch (e) {
            Logger.error(get_error_message(e, import.meta.url, 'sql'), sql, data);
            return undefined;
        }
    }
}
