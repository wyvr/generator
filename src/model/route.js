import { is_object } from '../utils/validate.js';
import { Env } from '../vars/env.js';

export class Route {
    constructor(data) {
        // default props
        this.cron = undefined;
        this.env = Env.get();
        this.initial = true;
        this.path = '';
        this.pkg = '';
        this.rel_path = '';

        // apply only known properties to the Route
        if (is_object(data)) {
            const data_keys = Object.keys(data);
            Object.keys(this).forEach((key) => {
                if (data_keys.indexOf(key) > -1) {
                    this[key] = data[key];
                }
            });
        }
    }
}
