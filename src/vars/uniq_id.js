import { FOLDER_CACHE } from '../constants/folder.js';
import { read, write } from '../utils/file.js';
import { uniq_id } from '../utils/uniq.js';
import { is_null } from '../utils/validate.js';
import { Cwd } from './cwd.js';

export class UniqId {
    static load() {
        let value = read(this.file());
        if (is_null(value)) {
            return undefined;
        }
        return value.trim();
    }
    static get() {
        if (!this.value) {
            this.set(uniq_id());
        }
        return this.value;
    }
    static set(value) {
        this.value = value;
        write(this.file(), value);
    }

    static file() {
        return Cwd.get(FOLDER_CACHE, 'uniq');
    }
}
