import { Logger } from './logger.js';
import { filled_object } from './validate.js';
import { clone } from './json.js';
import { Cwd } from '../vars/cwd.js';
import { FOLDER_GEN_CRON } from '../constants/folder.js';
import { Env } from '../vars/env.js';
import { get_error_message } from './error.js';

export function filter_cronjobs(cronjobs) {
    if (!filled_object(cronjobs)) {
        return [];
    }
    const date = new Date();
    const date_values = [
        date.getMinutes(), // Minute 0 - 59
        date.getHours(), // Hour 0 - 23
        date.getDate(), // Day 0 - 31
        date.getMonth() + 1, // Month 1 - 12
        date.getDay(), // Weekday 0 Sunday - 6 Saturday - 7 Sunday
    ];
    return Object.keys(cronjobs)
        .map((name) => {
            const cron = clone(cronjobs[name]);
            cron.name = name;
            cron.failed = false;
            return cron;
        })
        .filter((cron) => {
            if (!cron.when || !cron.what) {
                Logger.warning(`cron "${cron.name}" missing when or what properties`);
                return false;
            }
            const cron_parts = cron.when.split(' ');
            if (cron_parts.length != 5) {
                Logger.warning(`cron "${cron.name}" has an invalid when property "${cron.when}"`);
                return false;
            }
            const execute = cron_parts.every((part, index) => {
                if (part === '*') {
                    return true;
                }
                let check_value = date_values[index];

                // check if every x is set
                if (part.indexOf('*/') == 0) {
                    part = parseInt(part.replace(/^\*\/(\d+)$/, '$1'), 10);
                    return check_value % part === 0;
                }
                // check multiple values
                if (part.indexOf(',') > -1) {
                    return part.split(',').find((value) => parseInt(value, 10) === check_value);
                }
                return parseInt(part, 10) == check_value;
            });
            return execute;
        });
}
export async function execute_cronjobs(cronjobs) {
    return await Promise.all(
        cronjobs.map(async (job) => {
            const path = Cwd.get(FOLDER_GEN_CRON, job.what);
            Logger.block('cron job', job.name);
            try {
                job.result = (await import(path)).default({ options: job.options, isProd: Env.is_prod() });
            } catch (e) {
                Logger.error(get_error_message(e, path, 'cron'));
                job.failed = true;
                job.result = undefined;
            }
            return job;
        })
    );
}
