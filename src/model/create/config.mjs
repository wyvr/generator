import { filled_string } from '../../utils/validate.js';
import { generate_cron_name, questions_cron_interval } from './cron.mjs';

export const questions_config = [
    [
        {
            type: 'confirm',
            message: 'Is project config?',
            name: 'project_config',
            default: true,
        },
    ],
    {
        _field: 'project_config',
        true: [
            [
                {
                    type: 'input',
                    message: `What's the URL of the project?`,
                    name: 'url',
                    default: 'localhost',
                    validate: (value) => {
                        if (!filled_string(value)) {
                            return 'This is required';
                        }
                        return true;
                    },
                },
            ],
        ],
        _: [
            [
                {
                    type: 'confirm',
                    message: 'Add cron?',
                    name: 'use_cron',
                    default: false,
                },
            ],
            {
                _field: 'use_cron',
                true: [[generate_cron_name('cron_file'), questions_cron_interval]],
            },
        ],
    },
];
