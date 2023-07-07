import { Logger } from '../utils/logger.js';
import { filled_array } from '../utils/validate.js';
import { show_help } from './available_commands.js';

export async function unknown_command(config) {
    let command = config?.cli?.command;
    if (!filled_array(command)) {
        command = [];
    }
    const has_command = command.length > 0;
    const value = command.join(' ');
    Logger.error(has_command ? `unknown command ${value}` : 'command is missing');
    show_help({
        flags: false,
        search: has_command ? command : undefined
    });

    process.exit(1);
}
