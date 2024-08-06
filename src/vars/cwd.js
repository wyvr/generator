import { join } from 'node:path';
import { filled_array } from '../utils/validate.js';

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Cwd {
    static get(...parts) {
        if (!filled_array(parts)) {
            return Cwd.value;
        }
        const value = [Cwd.value, ...parts].flat(2).filter((x) => x);
        return join(...value);
    }
    static set(value) {
        Cwd.value = value;
    }
}
