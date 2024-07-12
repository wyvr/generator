import cluster from 'node:cluster';
import { is_null } from '../utils/validate.js';

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class IsWorker {
    static get() {
        if (is_null(IsWorker.value)) {
            return cluster.isWorker;
        }
        return !!IsWorker.value;
    }
    static set(value) {
        IsWorker.value = value;
    }
}
