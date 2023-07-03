import { get_present_command } from '../action/present.js';
import { Logger } from '../utils/logger.js';
import { collect_data_from_cli } from '../cli/interactive.js';
import { create_questions } from '../model/create.mjs';
import { Cwd } from '../vars/cwd.js';
import { clone } from '../utils/json.js';
import { join } from 'path';
import { to_dirname } from '../utils/to.js';
import { is_func } from '../utils/validate.js';
import { get_wyvr_version } from '../cli/config.js';
import { create_package } from '../utils/create/package.mjs';
import { create_file } from '../utils/create/file.mjs';
import { create_config } from '../utils/create/config.mjs';
import { create_cron } from '../utils/create/cron.mjs';
import { create_project } from '../utils/create/project.mjs';

export async function create_command(config) {
    const { command, flags } = get_present_command(config?.cli?.command, config?.cli?.flags);
    process.title = `wyvr ${command} ${process.pid}`;
    Logger.present('command', command, Logger.color.dim(flags));

    Logger.info('current directory', Cwd.get());

    const init_data = clone(config?.cli?.flags);

    const result = await collect_data_from_cli(create_questions, init_data);

    Logger.improve('result', result);
    /*
    {
        "type":"project",
        "name":"wyvr_app",
        "url":"wyvr.ddev.site",
        "local_package":true,
        "features":["assets","cron","i18n","pages","routes","src"],
        "cron_interval":"* * * * *",
        "i18n_folder":"en",
        "git_init":true
    }*/
    const templates = join(to_dirname(import.meta.url), '..', 'templates');

    Logger.improve('templates', templates);

    const version = get_wyvr_version();
    const type_match = {
        project: () => create_project(templates, version, result),
        package: () => create_package(result.name, templates, version, result, result.name),
        file: () => create_file(templates, version, result),
        config: () => create_config(templates, version, result),
        cron: () => create_cron(templates, version, result),
    }[result.type];
    if (type_match && is_func(type_match)) {
        type_match();
    }
    return null;
}
