import { Config } from '../utils/config.js';
import { execute_cronjobs, filter_cronjobs } from '../utils/cron.js';
import { measure_action } from './helper.js';

export async function cronjobs(name) {
    if (!name) {
        return;
    }
    const build_cronjobs = filter_cronjobs(Config.get('cron'), name);
    if (build_cronjobs.length === 0) {
        return;
    }
    // execute cronjobs with when '@<name>'
    await measure_action('cronjobs', async () => {
        await execute_cronjobs(build_cronjobs);
    });
}
