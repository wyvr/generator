import { filled_string } from '../../utils/validate.js';
import { questions_package_features, questions_package_features_additional } from './package.mjs';

export const questions_project = [
    [
        {
            type: 'input',
            message: `What's the name of the project?`,
            name: 'name',
            default: 'wyvr_app',
            validate: (value) => {
                if (!filled_string(value)) {
                    return 'This is required';
                }
                return true;
            },
        },
        {
            type: 'confirm',
            message: 'Create local package?',
            name: 'local_package',
            default: true,
        },
    ],
    {
        _field: 'local_package',
        true: [questions_package_features, questions_package_features_additional],
        _: [],
    },
];
