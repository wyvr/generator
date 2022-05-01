import { Logger } from '../utils/logger.js';
import { filled_array, is_object } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { UniqId } from '../vars/uniq_id.js';

export function present(config_data) {
    const id = UniqId.get();
    let formatted_id = id.substring(0, 5);
    if (id.length > 5) {
        formatted_id += Logger.color.dim(id.substring(5));
    }
    let command = config_data?.cli?.command;
    if (!filled_array(command)) {
        command = ['-'];
    }
    command = command.join(' ')
    // prepare process
    process.title = `wyvr ${command} ${process.pid}`;
    // present some variables
    Logger.present('pid', process.pid, Logger.color.dim(`${process.title}`));
    Logger.present('cwd', Cwd.get());

    Logger.present('id', formatted_id);
    Logger.present('environment', Env.name());

    let flags = '';
    if (is_object(config_data?.cli?.flags)) {
        flags = Object.keys(config_data.cli.flags).join(' ');
    }
    Logger.present('command', command, Logger.color.dim(flags));
}
