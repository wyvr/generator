import { join } from 'path';

export class PackageTreePath {
    static value = join('cache', 'package_tree.json');
    static get() {
        return this.value;
    }
}
