export class WatcherPaths {
    static get() {
        return this.value;
    }
    static set(value) {
        this.value = value;
    }
    static set_path(id, path) {
        this.value[id] = path;
    }
}
WatcherPaths.value = {};