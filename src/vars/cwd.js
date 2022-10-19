import { join } from 'path';
import { filled_array } from '../utils/validate.js';

export class Cwd {
    static get(...parts) {
        if (!filled_array(parts)) {
            return this.value;
        }
        const value = [this.value, ...parts].filter((x) => x);
        return join(...value);
    }
    static set(value) {
        this.value = value;
    }
}
