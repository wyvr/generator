import { CronState } from '@lib/model/cron';

export class Route {
    path: string = '';
    rel_path: string = '';
    pkg: any = '';
    initial: boolean = true;
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
