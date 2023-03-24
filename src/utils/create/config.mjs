import { join } from 'path';
import { Cwd } from '../../vars/cwd.js';
import { copy_template_file } from '../create.mjs';
import { to_tabbed } from '../to.js';
import { filled_string } from '../validate.js';
import { create_cron, get_cron_code } from './cron.mjs';

export function create_config(templates, version, result, target_dir = undefined) {
    let cron_code = '';
    if (filled_string(result.cron_file) && filled_string(result.cron_interval)) {
        cron_code = to_tabbed([['cron: {', get_cron_code(result.cron_file, result.cron_interval), '}']]);
        create_cron(templates, version, result, target_dir, false);
    }

    copy_template_file(
        join(templates, 'config', result.project_config ? 'project.mjs' : 'package.mjs'),
        Cwd.get(target_dir, 'wyvr.mjs'),
        {
            version,
            url: result.url,
            cron_code,
        }
    );
}
