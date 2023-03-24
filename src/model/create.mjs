import { questions_config } from './create/config.mjs';
import { questions_cron } from './create/cron.mjs';
import { questions_file } from './create/file.mjs';
import { questions_package } from './create/package.mjs';
import { questions_project } from './create/project.mjs';
import { questions_type } from './create/type.mjs';

export const create_questions = [
    questions_type,
    {
        _field: 'type',
        project: questions_project,
        package: questions_package,
        file: questions_file,
        config: questions_config,
        cron: questions_cron,
    }
];
