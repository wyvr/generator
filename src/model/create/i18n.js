import { Logger } from '../../utils/logger.js';

export const questions_i18n_folder = [
    {
        type: 'input',
        message: `Which language folders should be created? ${Logger.color.dim('comma seperated list')}`,
        name: 'i18n_folder',
        default: 'en'
    }
];

export const questions_i18n = [questions_i18n_folder];
