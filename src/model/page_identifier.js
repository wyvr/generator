import { Database } from '../../storage.js';
import { get_error_message } from '../utils/error.js';
import { Logger } from '../utils/logger.js';
import { Cwd } from '../vars/cwd.js';
import { FOLDER_STORAGE } from '../constants/folder.js';
import { remove } from '../utils/file.js';
import { parse } from '../utils/json.js';
import { filled_object, filled_string } from '../utils/validate.js';


const TABLE = 'list';
export class PageIdentifier {
    constructor() {
        this.#init();
    }
    #init() {
        this.db = new Database(PageIdentifier.get_db_file());
        if (!this.db) {
            throw new Error('Page Identifier Database could not be initialized');
        }
        this.db.create(TABLE, {
            file: { type: 'TEXT', primary: true, null: false, unique: true },
            identifier: { type: 'TEXT', null: true },
            data: { type: 'TEXT', null: true },
        });
    }

    get_file(file) {
        if (!filled_string(file)) {
            return undefined;
        }
        const entry = this.db.getFirst(`SELECT * FROM "${TABLE}" where file = ?`, [file]);

        return PageIdentifier.parse_db_entry(entry);
    }
    get_by_identifier(identifier) {
        if (!filled_string(identifier)) {
            return undefined;
        }
        const entries = this.db.getAll(`SELECT * FROM "${TABLE}" where identifier = ?`, [identifier]);
        if(!entries) {
            return undefined;
        }
        return entries.map(PageIdentifier.parse_db_entry);
    }

    update_file(file, identifier) {
        if (!filled_string(file)) {
            return undefined;
        }
        if (!identifier?.identifier) {
            return undefined;
        }

        try {
            this.db.run(`INSERT OR REPLACE INTO ${TABLE} (file, identifier, data) VALUES (?, ?, ?);`, [
                file,
                identifier.identifier,
                JSON.stringify(identifier)
            ]);
        } catch (e) {
            Logger.error(get_error_message(e, undefined, 'page identifier update'));
            return undefined;
        }
        return { file, identifier };
    }

    clear() {
        if (this.db) {
            remove(PageIdentifier.get_db_file());
            this.db = undefined;
        }
        this.#init();
    }

    static get_db_file() {
        return Cwd.get(FOLDER_STORAGE, 'page_identifier.db');
    }
    static parse_db_entry(entry) {
        if (!filled_object(entry) || !entry.file) {
            return undefined;
        }
        entry.data = parse(entry.data);
        return entry;
    }
}
