import { is_object, in_array } from '../utils/validate.js';
import { Env } from '../vars/env.js';

export class Page {
    constructor(data) {
        // default props
        this.cron = undefined;
        this.env = Env.get();
        this.initial = true;
        this.path = '';
        this.pkg = '';
        this.rel_path = '';

        // apply only known properties to the Page
        if (is_object(data)) {
            const data_keys = Object.keys(data);
            for (const key of Object.keys(this)) {
                if (in_array(data_keys, key)) {
                    this[key] = data[key];
                }
            }
        }
    }
}
