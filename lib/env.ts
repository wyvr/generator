import { EnvModel } from '@lib/model/env';

export class Env {
    private static env: EnvModel = EnvModel.prod;
    
    static set(value: string | number | EnvModel) {
        if (!value) {
            return this.get();
        }
        let env = value;
        // string to enum
        if (typeof value == 'string' && EnvModel[value] != null) {
            env = EnvModel[value];
        }
        // number to enum
        if (typeof value == 'number' && EnvModel[value] != null && EnvModel[EnvModel[value]] != null) {
            env = EnvModel[EnvModel[value]];
        }
        if (env) {
            this.env = <EnvModel>env;
        }
        return this.get();
    }
    static get(): EnvModel {
        return this.env;
    }
    static is_debug() {
        return this.get() == EnvModel.debug || this.is_dev();
    }
    static is_dev() {
        return this.get() == EnvModel.dev;
    }
    static is_prod() {
        return this.get() == EnvModel.prod;
    }
}
