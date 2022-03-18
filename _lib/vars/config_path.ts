import { join } from 'path';

export class ConfigPath {
    static value = join('cache', 'config.json');
    static get() {
        return this.value;
    }
}
