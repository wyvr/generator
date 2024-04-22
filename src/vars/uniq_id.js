import { FOLDER_CACHE } from '../constants/folder.js';
import { Event } from '../utils/event.js';
import { read, write } from '../utils/file.js';
import { uniq_id } from '../utils/uniq.js';
import { is_null } from '../utils/validate.js';
import { Cwd } from './cwd.js';

// biome-ignore lint/complexity/noStaticOnlyClass: should be static only
export class UniqId {
    static load() {
        const value = read(this.file());
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
        Event.emit('project', 'build_id', value);
        this.value = value;
    }
    static persist() {
        write(this.file(), this.value);
    }

    static file() {
        return Cwd.get(FOLDER_CACHE, 'uniq');
    }
}
