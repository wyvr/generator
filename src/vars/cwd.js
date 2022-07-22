import { join } from 'path';
import { filled_array } from '../utils/validate.js';

export class Cwd {
    static get(...parts) {
        if (!filled_array(parts)) {
            return this.value;
        }
        return join(this.value, ...parts);
    }
    static set(value) {
        this.value = value;
    }
}
