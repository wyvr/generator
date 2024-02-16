import { filled_string } from '../../utils/validate.js';
import { generate_cron_name, questions_cron_interval } from './cron.js';
import { questions_i18n } from './i18n.js';

export const questions_package_features = [
    {
        type: 'checkbox',
        message: `What should be included in the package?`,
        name: 'features',
        choices: [
            {
                name: `Assets`,
                value: 'assets',
                checked: true
            },
            {
                name: `Cron`,
                value: 'cron',
                checked: true
            },
            {
                name: `DevTools`,
                value: 'devtools'
            },
            {
                name: `I18N`,
                value: 'i18n',
                checked: true
            },
            {
                name: `Pages`,
                value: 'pages',
                checked: true
            },
            {
                name: `Plugins`,
                value: 'plugins',
                checked: true
            },
            {
                name: `Routes`,
                value: 'routes',
                checked: true
            },
            {
                name: `Source`,
                value: 'src',
                checked: true
            }
        ]
    }
];

export const questions_package_features_additional = {
    _field: 'features',
    _: [],
    cron: [[generate_cron_name('cron_file'), questions_cron_interval]],
    i18n: questions_i18n
};

export const questions_package = [
    [
        {
            type: 'input',
            message: `What's the name of the package?`,
            name: 'name',
            default: 'local',
            validate: (value) => {
                if (!filled_string(value)) {
                    return 'This is required';
                }
                return true;
            }
        }
    ],
    questions_package_features,
    questions_package_features_additional
];
