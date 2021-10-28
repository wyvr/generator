import { CronState } from '@lib/model/cron';

export class Route {
    path = '';
    rel_path = '';
    pkg: any = '';
    initial = true;
    cron: CronState = null;
    constructor(data) {
        if (data) {
            const data_keys = Object.keys(data);
            Object.keys(this).forEach((key) => {
                if (data_keys.indexOf(key) > -1) {
                    this[key] = data[key];
                }
            });
        }
    }
}
