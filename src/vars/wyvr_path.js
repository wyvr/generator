import { join } from 'node:path';
import { to_dirname } from '../utils/to.js';

export class WyvrPath {
    static get() {
        if (!this.value) {
            this.value = join(to_dirname(import.meta.url), '..');
        }
        return this.value;
    }
    static set(value) {
        this.value = value;
    }
}
