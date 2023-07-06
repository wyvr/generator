import { join } from 'path';
import { Cwd } from '../../vars/cwd.js';
import { copy_template_file } from '../create.js';
import { create_config } from './config.js';
import { create_package } from './package.js';

export function create_project(templates, version, result) {
    copy_template_file(join(templates, 'project', 'package.json'), Cwd.get(result.name, 'package.json'), {
        name: result.name,
        version,
    });
    copy_template_file(join(templates, 'project', '.gitignore'), Cwd.get(result.name, '.gitignore'), {});
    if (result.local_package) {

        create_package('local', templates, version, result, `${result.name}/local`);
        // @TODO main config is wrong
        /*create_config(
            join(templates, 'config', 'wyvr.js'),
            result.url,
            result.features.includes('cron') ? result.cron_name : undefined,
            result.cron_interval,
            version,
            target_dir
            );*/
    }
    result.project_config = true;
    result.cron_file = undefined;
    result.cron_interval = undefined;
    create_config(templates, version, result);
}
