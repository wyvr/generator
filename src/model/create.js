import { questions_config } from './create/config.js';
import { questions_cron } from './create/cron.js';
import { questions_file } from './create/file.js';
import { questions_package } from './create/package.js';
import { questions_project } from './create/project.js';
import { questions_type } from './create/type.js';
import { questions_ddev } from './create/ddev.js';

export const create_questions = [
    questions_type,
    {
        _field: 'type',
        project: questions_project,
        package: questions_package,
        file: questions_file,
        config: questions_config,
        cron: questions_cron,
        ddev: questions_ddev,
    },
];
