import { join } from 'node:path';
import { Cwd } from '../../vars/cwd.js';
import { copy_template_file } from '../create.js';
import { to_tabbed } from '../to.js';
import { filled_string } from '../validate.js';
import { create_cron, get_cron_code } from './cron.js';

export function create_config(templates, version, result, target_dir = undefined) {
    let cron_code = '';
    if (filled_string(result.cron_file) && filled_string(result.cron_interval)) {
        cron_code = to_tabbed([['cron: {', get_cron_code(result.cron_file, result.cron_interval), '}']]);
        create_cron(templates, version, result, target_dir, false);
    }
    let template_file = 'package.js';
    let target = target_dir;
    if (result.project_config) {
        template_file = 'project.js';
        if (result.name && target_dir === undefined) {
            target = result.name;
        }
    }
    copy_template_file(join(templates, 'config', template_file), Cwd.get(target, 'wyvr.js'), {
        version,
        url: result.url,
        cron_code,
        local_package: result?.local_package
            ? `{
            name: 'Local',
            path: 'local',
        },`
            : `// Add local packages
        /*{
            name: 'Local',
            path: 'local',
        },*/`
    });
}
