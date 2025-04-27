import { extname, basename } from 'node:path';
import { Cwd } from '../../vars/cwd.js';
import { collect_files, is_dir, read } from '../file.js';
import { filled_array, filled_string, is_array, is_func } from '../validate.js';
import { Logger } from '../logger.js';
import { Database } from './database.js';
import { FOLDER_GEN_SERVER } from '../../constants/folder.js';
import { get_error_message } from '../error.js';

export class Migrations {
    #table = '$migrations';
    #valid = false;
    #db;
    #dbName;

    /**
     * Create a new migrations instance for another database
     * @param {string} db file path
     * @param {string} folder of the migrations, relative to the src folder
     */
    constructor(db, folder) {
        this.#dbName = basename(db);
        this.#db = new Database(db);
        this.folder = Cwd.get(FOLDER_GEN_SERVER, folder);
        if (this.#db && is_dir(this.folder)) {
            this.#valid = true;
        }
    }

    /**
     * Validate the instance
     * @returns {boolean} is the instance valid
     */
    #isValid() {
        if (!this.#valid) {
            Logger.warning('migrations are not valid', this.folder);
            return false;
        }
        return true;
    }

    /**
     * Apply the migrations to the database
     * @returns {string[]} applied migrations
     */
    async apply() {
        if (!this.#isValid()) {
            return [];
        }
        const files = this.getFiles(this.folder);
        if (!filled_array(files)) {
            Logger.warning(this.#dbName, 'no migrations found in', this.folder);
            return [];
        }
        const migrations = this.getAppliedMigrations();
        const files_to_apply = this.getFilesToApply(files, migrations);
        const applied_migrations = await this.applyFiles(files_to_apply);
        if (applied_migrations.length === 0) {
            Logger.warning(this.#dbName, 'no migrations applied');
        }
        return applied_migrations;
    }

    /**
     * Get all files from the migration folder
     * @param {string[]} folder
     * @returns {string[]} files
     */
    getFiles(folder) {
        if (!this.#isValid()) {
            return [];
        }
        if (!filled_string(folder)) {
            return [];
        }
        const files = collect_files(folder).filter((file) => file.endsWith('.js') || file.endsWith('.sql'));
        if (!filled_array(files)) {
            return [];
        }
        return files;
    }

    /**
     * Get the applied migrations from the database
     * @returns {any[]} applied migrations
     */
    getAppliedMigrations() {
        if (!this.#isValid()) {
            return [];
        }
        try {
            if (!this.#db.getFirst(`SELECT name FROM sqlite_master WHERE type='table' AND name='${this.#table}'`)) {
                return [];
            }
            return this.#db.getAll(`SELECT * FROM "${this.#table}"`);
        } catch (_) {
            return [];
        }
    }

    /**
     * Get the files to apply by comparing the files in the folder with the applied migrations
     * @param {string[]} files
     * @param {string[]} migrations
     * @returns {string[]} files to apply
     */
    getFilesToApply(files, migrations) {
        if (!filled_array(files) || !is_array(migrations)) {
            return [];
        }
        const migrations_files = migrations.map((row) => row.file).filter(Boolean);
        const result = [];
        for (const file of files) {
            if (!filled_string(file)) {
                continue;
            }
            const rel_file = this.getRelativePath(file);
            if (!migrations_files.includes(rel_file)) {
                result.push(file);
            }
        }
        return result;
    }

    /**
     * Apply the files to the database by running the queries or functions in the files
     * @param {string[]} files
     * @returns {string[]} applied migrations
     */
    async applyFiles(files) {
        this.#db.run(`
            CREATE TABLE
            IF NOT EXISTS "${this.#table}" (
                file TEXT STRICT UNIQUE,
                applied TEXT DEFAULT (CURRENT_TIMESTAMP)
            );`);
        if (!filled_array(files)) {
            return [];
        }
        const applied_migrations = [];
        const target = Cwd.get(FOLDER_GEN_SERVER, this.folder);

        for (const file of files) {
            let applied = false;
            try {
                switch (extname(file)) {
                    case '.js': {
                        const module = await import(file);
                        const fn = module?.default;
                        if (!is_func(fn)) {
                            continue;
                        }
                        fn(this.#db);
                        applied = true;
                        break;
                    }
                    case '.sql': {
                        const query = read(file);
                        if (!query) {
                            continue;
                        }
                        this.#db.run(query);
                        applied = true;
                        break;
                    }
                }
                this.#db.run(`INSERT INTO "${this.#table}" (file) VALUES (@file)`, {
                    file: this.getRelativePath(file)
                });
            } catch (e) {
                Logger.error(this.#dbName, get_error_message(e, file, 'migration'));
                continue;
            }
            if (applied) {
                Logger.info(this.#dbName, 'applied migration', this.getRelativePath(file));
                applied_migrations.push(file);
            }
        }
        return applied_migrations;
    }

    /**
     * Get the relative path of the file
     * @param {string} file
     * @returns {string|undefined} relative path
     */
    getRelativePath(file) {
        if (!filled_string(file)) {
            return undefined;
        }
        return file.replace(this.folder, '');
    }
}
