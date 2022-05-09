import cluster from 'cluster';
import { is_null } from '../utils/validate.js';

export class IsWorker {
    static get() {
        if (is_null(this.value)) {
            return cluster.isWorker;
        }
        return !!this.value;
    }
    static set(value) {
        this.value = value;
    }
}
