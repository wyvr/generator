import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

export class WyvrPath {
    static get() {
        if (!this.value) {
            this.value = dirname(resolve(join(fileURLToPath(import.meta.url), '..')));
        }
        return this.value;
    }
    static set(value) {
        this.value = value;
    }
}
