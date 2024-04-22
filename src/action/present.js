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

    // prepare process
    // present some variables
    Logger.present('pid', process.pid);
    Logger.present('cwd', Cwd.get());

    Logger.present('id', formatted_id);
    Logger.present('environment', Env.name());
    const { command, flags } = get_present_command(config_data?.cli?.command, config_data?.cli?.flags);
    process.title = `wyvr ${command}`;
    Logger.present('command', command, Logger.color.dim(flags));
}
export function get_present_command(command_array, flags_array) {
    if (!filled_array(command_array)) {
        command_array = ['-'];
    }
    const command = command_array.join(' ');

    let flags = '';
    if (is_object(flags_array)) {
        flags = Object.keys(flags_array).join(' ');
    }
    return {
        command,
        flags
    };
}
