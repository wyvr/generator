import { Logger } from './logger.js';
import { filled_object } from './validate.js';
import { clone } from './json.js';
import { Cwd } from '../vars/cwd.js';
import { FOLDER_GEN_CRON } from '../constants/folder.js';
import { Env } from '../vars/env.js';
import { get_error_message } from './error.js';

export function filter_cronjobs(cronjobs, event_name = undefined) {
    if (!filled_object(cronjobs)) {
        return [];
    }
    const date = new Date();
    const date_values = [
        date.getMinutes(), // Minute 0 - 59
        date.getHours(), // Hour 0 - 23
        date.getDate(), // Day 0 - 31
        date.getMonth() + 1, // Month 1 - 12
        date.getDay() // Weekday 0 Sunday - 6 Saturday - 7 Sunday
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
            // check the configured event is used in the cron.when
            if (event_name) {
                return cron.when.indexOf('@') === 0 && cron.when === `@${event_name}`;
            }

            // ignore event based cronjobs from here on
            if (cron.when.indexOf('@') === 0) {
                return false;
            }
            // check if the when is valid
            const cron_parts = cron.when.split(' ');
            if (cron_parts.length !== 5) {
                Logger.warning(`cron "${cron.name}" has an invalid when property "${cron.when}"`);
                return false;
            }
            const execute = cron_parts.every((part, index) => {
                if (part === '*') {
                    return true;
                }
                const check_value = date_values[index];

                // check if every x is set
                if (part.indexOf('*/') === 0) {
                    part = Number.parseInt(part.replace(/^\*\/(\d+)$/, '$1'), 10);
                    return check_value % part === 0;
                }
                // check multiple values
                if (part.indexOf(',') > -1) {
                    return part.split(',').find((value) => Number.parseInt(value, 10) === check_value);
                }
                return Number.parseInt(part, 10) === check_value;
            });
            return execute;
        });
}
export async function execute_cronjobs(cronjobs) {
    if (!Array.isArray(cronjobs)) {
        return [];
    }
    return await Promise.all(
        cronjobs.map(async (job) => {
            const scripts = [];
            if (typeof job.what === 'string') {
                scripts.push(job.what);
            }
            if (Array.isArray(job.what)) {
                scripts.push(...job.what.filter((job) => typeof job === 'string'));
            }
            if (scripts.length === 0) {
                Logger.warning('cron job', job.name, 'has no script assigned');
                job.failed = true;
                job.result = undefined;
                return job;
            }
            Logger.block('cron job', job.name, scripts.length > 1 ? `with ${scripts.length} scripts` : '');
            job.result = [];
            for (const script of scripts) {
                const path = Cwd.get(FOLDER_GEN_CRON, script);
                try {
                    const cronjob = await import(path);
                    job.result.push(await cronjob.default({ options: job.options, isProd: Env.is_prod() }));
                } catch (e) {
                    Logger.error(get_error_message(e, path, `cron ${job.name}`));
                    job.failed = true;
                }
            }
            if (job.result.length === 0) {
                job.result = undefined;
            }
            return job;
        })
    );
}
