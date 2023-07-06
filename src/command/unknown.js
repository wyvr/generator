import { Logger } from '../utils/logger.js';
import { filled_array } from '../utils/validate.js';
import { available_commands, show_command, show_help } from './available_commands.js';

export async function unknown_command(config) {
    let command = config?.cli?.command;
    if (!filled_array(command)) {
        command = [];
    }
    const has_command = command.length > 0;
    const value = command.join(' ');
    Logger.error(has_command ? `unknown command ${value}` : 'command is missing');
    if (has_command) {
        // check if command was found with the text
        const found_command = Object.keys(available_commands).filter((key) => {
            return command.find((c) => key.indexOf(c) !== -1);
        });
        if (found_command.length > 0) {
            Logger.log('');
            Logger.info('did you mean?');
            found_command.forEach((key) =>
            show_command(key, {
                flags: true,
            })
            );
            process.exit(1);
        }
        // check if description was found with the text
        const found_desc = Object.keys(available_commands).filter((key) => {
            return command.find((c) => available_commands[key].desc.toLowerCase().indexOf(c) !== -1);
        });
        if (found_desc.length > 0) {
            Logger.log('');
            Logger.info('did you mean?');
            found_desc.forEach((key) =>
            show_command(key, {
                flags: true,
            })
            );
            process.exit(1);
        }
    }
    show_help({
        flags: false,
    });

    process.exit(1);
}
