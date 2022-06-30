import { Logger } from '../utils/logger.js';
import { filled_array } from '../utils/validate.js';

export async function unknown_command(config) {
    let command = config?.cli?.command;
    if (!filled_array(command)) {
        command = [];
    }
    Logger.error(command.length == 0 ? 'no command found' : `unknown command ${command.join(' ')}`);
    process.exit(1);
}
