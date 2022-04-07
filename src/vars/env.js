import { EnvType } from '../struc/env.js';
import { array_contains, is_int } from '../utils/validate.js';

export class Env {
    static get() {
        if (!is_int(this.value)) {
            return EnvType.prod;
        }
        return this.value;
    }
    static set(value) {
        // allow only allowed types
        if (array_contains(Object.values(EnvType), value)) {
            this.value = value;
        }
        return this.get();
    }
    static is_debug() {
        return this.get() == EnvType.debug || this.is_dev();
    }
    static is_dev() {
        return this.get() == EnvType.dev;
    }
    static is_prod() {
        return this.get() == EnvType.prod;
    }
    static json_spaces() {
        if (this.is_prod()) {
            return undefined;
        }
        return 4;
    }
    static name() {
        return Object.keys(EnvType).find((key) => EnvType[key] === this.value) || 'prod';
    }
}