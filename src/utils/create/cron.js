import { extname, join } from 'node:path';
import { Cwd } from '../../vars/cwd.js';
import { copy_template_file } from '../create.js';
import { to_extension } from '../file.js';
import { Logger } from '../logger.js';
import { to_tabbed } from '../to.js';

export function create_cron(templates, version, result, target_dir = undefined, show_insert_hint = true) {
    if (!result.cron_file) {
        result.cron_file = result.name;
    }
    const ext = extname(result.cron_file);
    if (!['.mjs', '.js'].includes(ext)) {
        result.cron_file = to_extension(result.cron_file, '.js');
    }
    copy_template_file(join(templates, 'cron', 'cron.js'), Cwd.get(target_dir, 'cron', result.cron_file), {
        version
    });
    if (show_insert_hint) {
        Logger.warning('add the following cron entry into your wyvr config file', to_tabbed(['', '', ...get_cron_code(result.cron_file, result.cron_interval)]));
    }
}

export function get_cron_code(cron_file, cron_interval) {
    const name = cron_file ? cron_file.replace(/\.[mc]?js$/, '').replace(/[/-\s]+/g, '_') : '';
    return [`${name}: {`, [`when: '${cron_interval}',`, `what: '${cron_file}',`, 'options: {}'], '}'];
}
