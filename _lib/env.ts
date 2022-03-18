import { EnvType } from '@lib/struc/env';

export class Env {
    private static env: EnvType = EnvType.prod;
    
    static set(value: string | number | EnvType) {
        if (!value) {
            return this.get();
        }
        let env = null;
        // string to enum
        if (typeof value == 'string' && EnvType[value] != null) {
            env = EnvType[value];
        }
        // number to enum
        if (typeof value == 'number' && EnvType[value] != null && EnvType[EnvType[value]] != null) {
            env = EnvType[EnvType[value]];
        }
        if (env) {
            this.env = <EnvType>env;
        }
        return this.get();
    }
    static get(): EnvType {
        return this.env;
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
    static json_spaces(env) {
        if(env?.WYVR_ENV === 'prod') {
            return undefined;
        }
        return 4;
    }
}
