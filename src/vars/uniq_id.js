import { FOLDER_CACHE } from '../constants/folder.js';
import { PROJECT_EVENT, PROJECT_EVENT_BUILD_ID } from '../constants/project_events.js';
import { Event } from '../utils/event.js';
import { read, write } from '../utils/file.js';
import { uniq_id } from '../utils/uniq.js';
import { is_null } from '../utils/validate.js';
import { Cwd } from './cwd.js';

// biome-ignore lint/complexity/noStaticOnlyClass: should be static only
export class UniqId {
    static load() {
        const value = read(UniqId.file());
        if (is_null(value)) {
            return undefined;
        }
        return value.trim();
    }
    static get() {
        if (!UniqId.value) {
            UniqId.set(uniq_id());
        }
        return UniqId.value;
    }
    static set(value) {
        Event.emit(PROJECT_EVENT, PROJECT_EVENT_BUILD_ID, value);
        UniqId.value = value;
    }
    static persist() {
        write(UniqId.file(), UniqId.value);
    }

    static file() {
        return Cwd.get(FOLDER_CACHE, 'uniq');
    }
}
