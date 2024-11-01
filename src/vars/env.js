import { EnvType } from '../struc/env.js';
import { in_array, is_int } from '../utils/validate.js';

export const Env = {
    value: EnvType.prod,
    get() {
        if (!is_int(Env.value)) {
            return EnvType.prod;
        }
        return Env.value;
    },
    set(value) {
        // allow only allowed types
        if (in_array(Object.values(EnvType), value)) {
            Env.value = value;
        }
        return Env.get();
    },
    is_debug() {
        return Env.get() === EnvType.debug;
    },
    is_dev() {
        return Env.get() === EnvType.dev || Env.is_debug();
    },
    is_prod() {
        return Env.get() === EnvType.prod;
    },
    json_spaces() {
        if (Env.is_prod()) {
            return undefined;
        }
        return 4;
    },
    name() {
        return get_name(Env.value) || 'prod';
    }
};

export function get_name(value) {
    return Object.keys(EnvType).find((key) => EnvType[key] === value);
}
