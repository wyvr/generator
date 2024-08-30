import { Database } from '../../storage.js';
import { FOLDER_STORAGE } from '../constants/folder.js';
import { get_error_message } from '../utils/error.js';
import { remove } from '../utils/file.js';
import { parse } from '../utils/json.js';
import { Logger } from '../utils/logger.js';
import { filled_array, filled_object, filled_string, is_array } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';

const TABLE = 'list';
export class Dependency {
    constructor() {
        this.#init();
    }
    #init() {
        this.db = new Database(Dependency.get_db_file());
        if (!this.db) {
            throw new Error('Dependency Database could not be initialized');
        }
        this.db.create(TABLE, {
            file: { type: 'TEXT', primary: true, null: false, unique: true },
            children: { type: 'TEXT', null: true },
            root: { type: 'TEXT', null: true },
            standalone: { type: 'TEXT', null: true },
            config: { type: 'TEXT', null: true }
        });
    }

    get_file(file) {
        if (!filled_string(file)) {
            return undefined;
        }
        const entry = this.db.getFirst(`SELECT * FROM "${TABLE}" where file = ?`, [file]);

        return Dependency.parse_db_entry(entry);
    }

    update_file(file, childs, config) {
        if (!filled_string(file)) {
            return undefined;
        }
        if (config?.render !== undefined && !filled_string(config?.render)) {
            return undefined;
        }
        const render = config?.render;
        const children = JSON.stringify(is_array(childs) ? childs : []);
        const root = ['src/doc/', 'src/layout/', 'src/page/', 'routes/', 'cron/', 'commands/', 'plugins/', 'pages/']
            .find((key) => file.indexOf(key) === 0)
            ?.replace('src/', '')
            .replace('/', '');

        // console.log(file, root, children);

        try {
            this.db.run(`INSERT OR REPLACE INTO ${TABLE} (file, children, root, standalone, config) VALUES (?, ?, ?, ?, ?);`, [
                file,
                children,
                root,
                render,
                JSON.stringify(config)
            ]);
        } catch (e) {
            Logger.error(get_error_message(e, undefined, 'dependency update'));
            return undefined;
        }
        return { file, children, root, render, config };
    }

    get_index() {
        const result = this.db.getAll(`SELECT * FROM "${TABLE}"`);
        if (!filled_array(result)) {
            return undefined;
        }
        const index = {};
        for (const entry of result) {
            const parsed = Dependency.parse_db_entry(entry);
            if (!parsed) {
                continue;
            }
            index[parsed.file] = parsed;
        }
        return index;
    }

    get_inverted_index() {
        const index = this.get_index();
        const inverted_index = {};
        for (const [key, value] of Object.entries(index)) {
            if (inverted_index[key]) {
                inverted_index[key] = {
                    parents: inverted_index[key].parents,
                    ...value
                };
            } else {
                inverted_index[key] = value;
            }
            if (filled_array(value.children)) {
                for (const child of value.children) {
                    if (!inverted_index[child]) {
                        inverted_index[child] = {};
                    }
                    if (!Array.isArray(inverted_index[child].parents)) {
                        inverted_index[child].parents = [];
                    }
                    inverted_index[child].parents.push(key);
                }
            }
        }
        return inverted_index;
    }

    clear() {
        if (this.db) {
            remove(Dependency.get_db_file());
            this.db = undefined;
        }
        this.#init();
    }

    static get_db_file() {
        return Cwd.get(FOLDER_STORAGE, 'dependency.db');
    }
    static parse_db_entry(entry) {
        if (!filled_object(entry) || !entry.file) {
            return undefined;
        }
        let children = [];
        if (filled_string(entry.children) && entry.children !== '[]') {
            children = parse(entry.children);
        }
        entry.config = parse(entry.config);
        return { ...entry, children };
    }
}
