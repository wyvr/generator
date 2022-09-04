import { is_null, is_object } from '../utils/validate.js';

export class WatcherPaths {
    static get() {
        return this.value;
    }
    static set(value) {
        if (is_null(value) || is_object(value)) {
            this.value = value;
        }
    }
    static set_path(id, path) {
        this.value[id] = path;
    }
}
WatcherPaths.value = {};
