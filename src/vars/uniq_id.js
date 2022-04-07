import { join } from 'path';
import { FOLDER_CACHE } from '../constants/folder.js';
import { read, write } from '../utils/file.js';
import { uniq } from '../utils/uniq.js';
import { Cwd } from './cwd.js';

export class UniqId {
    static load() {
        return read(this.file());
    }
    static get() {
        if (!this.value) {
            this.set(uniq());
        }
        return this.value;
    }
    static set(value) {
        this.value = value;
        write(this.file(), value);
    }

    static file() {
        return join(Cwd.get(), FOLDER_CACHE, 'uniq');
    }
}
