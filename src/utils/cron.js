import { get_exec_request, process_exec_request } from '../action/exec.js';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { uniq_id } from './uniq.js';
import { filled_array, filled_object } from './validate.js';
import { clone } from './json.js';


export function get_cron_helper() {
    return {
        exec: async (url, options) => {
            const request = {
                url,
                path: url,
                method: options?.method || 'GET',
            };
            const uid = uniq_id();
            try {
                const exec = get_exec_request(request);
                if (exec) {
                    Logger.debug('exec', url, exec.url);
                    return await process_exec_request(request, undefined, uid, exec, false);
                }
            } catch (e) {
                Logger.error(get_error_message(e, url, 'cron'));
            }
            return false;
        },
    };
}

export function filter_cronjobs(cronjobs) {
    if (!filled_object(cronjobs)) {
        return [];
    }
    const date = new Date();
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
                let check_value;
                switch (index) {
                    case 0:
                        check_value = date.getMinutes(); // Minute 0 - 59
                        break;
                    case 1:
                        check_value = date.getHours(); // Hour 0 - 23
                        break;
                    case 2:
                        check_value = date.getDate(); // Day 1 - 31
                        break;
                    case 3:
                        check_value = date.getMonth() + 1; // Month 1 - 12
                        break;
                    case 4:
                        check_value = date.getDay(); // Weekday 0 Sunday - 6 Saturday - 7 Sunday
                        break;
                }
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
