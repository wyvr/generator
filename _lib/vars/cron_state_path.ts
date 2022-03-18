import { join } from 'path';

export class CronStatePath {
    static value = join('cache', 'cron.json');
    static get() {
        return this.value;
    }
}
