import { filled_string } from '../../utils/validate.js';

export const questions_cron_interval = {
    type: 'list',
    message: `Select interval for the cron?`,
    name: 'cron_interval',
    default: 0,
    choices: [
        {
            name: `Every minute`,
            value: '* * * * *',
        },
        {
            name: `Every 15 minutes`,
            value: '*/15 * * * *',
        },
        {
            name: `Every 4 hours`,
            value: '0 */4 * * *',
        },
        {
            name: `Every day at 2am`,
            value: '0 2 * * *',
        },
    ],
};
export function generate_cron_name(name = 'name') {
    return {
        type: 'input',
        message: `What's the scope and name of the cron?`,
        name,
        default: 'scope/process.mjs',
        validate: (value) => {
            if (!filled_string(value)) {
                return 'This is required';
            }
            return true;
        },
    };
}
export const questions_cron = [[generate_cron_name(), questions_cron_interval]];
