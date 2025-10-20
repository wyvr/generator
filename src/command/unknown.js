import { collect_data_from_cli } from '../cli/interactive.js';
import { execute_custom_command } from '../command.js';
import { Logger } from '../utils/logger.js';
import { filled_string, is_array } from '../utils/validate.js';
import { show_help } from './help.js';

export async function unknown_command(config, commands) {
    if (!commands) {
        Logger.error('no internal commands found');
        process.exit(1);
        return;
    }

    const search_result = await show_help(
        {
            flags: false,
            search: config?.cli?.command
        },
        commands
    );
    const search_command = config?.cli?.command.join(' ');
    if (filled_string(search_result.command)) {
        if (!search_result.exact_match) {
            const execute_result = await collect_data_from_cli(
                [
                    [
                        {
                            type: 'confirm',
                            message: `should the command ${search_result.command} be executed instead of ${search_command}?`,
                            name: 'execute',
                            default: false
                        }
                    ]
                ],
                {}
            );
            if (execute_result.execute !== true) {
                Logger.error('unknown command', search_command);
                process.exit(1);
                return;
            }
        }
        const result = await execute_custom_command(config, search_result.command, commands);
        return result;
    }
    if (is_array(config?.cli?.command) && config.cli.command.length === 0) {
        Logger.info('no command provided');
        return;
    }
    Logger.error('unknown command', search_command);
    process.exit(1);
}
