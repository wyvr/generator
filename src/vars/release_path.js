import { join } from 'node:path';
import { filled_array } from '../utils/validate.js';

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class ReleasePath {
    static get(...parts) {
        if (!filled_array(parts)) {
            return ReleasePath.value;
        }
        const value = [ReleasePath.value, ...parts].flat(2).filter((x) => x);
        return join(...value);
    }
    static set(value) {
        ReleasePath.value = value;
    }
}
