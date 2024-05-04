// import { app_command } from './command/app';
import { get_config_data } from './action/get_config_data.js';
import { app_command } from './command/app.js';
import { build_command } from './command/build.js';
import { dev_command } from './command/dev.js';
import { clear_command } from './command/clear.js';
import { create_command } from './command/create.js';
import { cron_command } from './command/cron.js';
import { health_command } from './command/health.js';
import { unknown_command } from './command/unknown.js';
import { help_command } from './command/help.js';
import { version_command } from './command/version.js';
import { test_command } from './command/test.js';
import { info_command } from './command/info.js';
import { get_logo } from './presentation/logo.js';
import { nano_to_milli } from './utils/convert.js';
import { Logger } from './utils/logger.js';
import { to_plain } from './utils/to.js';
import { filled_array, filled_string, is_func } from './utils/validate.js';
import { Cwd } from './vars/cwd.js';
import { WorkerController } from './worker/controller.js';
import { Event } from './utils/event.js';
import { get_commands } from './command/available_commands.js';
import { UniqId } from './vars/uniq_id.js';

export function get_command(config) {
    const commands = config?.cli?.command;
    if (!filled_array(commands)) {
        return undefined;
    }
    return commands[0];
}

export async function command(base_config) {
    const start = process.hrtime.bigint();
    Cwd.set(base_config?.cli?.cwd);
    let result = '';
    const config = get_config_data(base_config);
    if (!config?.cli?.flags?.silent) {
        const logo = get_logo(config?.version);
        /* eslint-disable no-console */
        console.error(config?.cli?.flags?.plain ? to_plain(logo) : logo);
        console.error('');
        /* eslint-enable */
    }

    Event.emit('project', 'config', config);

    const command = get_command(config);
    switch (command) {
        case 'app':
            result = await app_command(config);
            break;
        case 'dev':
            result = await dev_command(config);
            break;
        case 'build':
            result = await build_command(config);
            break;
        case 'health':
            result = await health_command(config);
            break;
        case 'help': {
            const commands = await get_commands();
            result = await help_command(config, commands);
            break;
        }
        case 'info':
            result = await info_command(config);
            break;
        case 'clear':
            result = await clear_command(config);
            break;
        case 'create':
            result = await create_command(config);
            break;
        case 'cron':
            result = await cron_command(config);
            break;
        case 'test':
            result = await test_command(config);
            break;
        case 'version':
            result = await version_command(config);
            break;
        default:
            {
                // try to execute the custom command
                const commands = await get_commands();
                const command_result = await execute_custom_command(config, command, commands);

                if (command_result?.executed) {
                    result = command_result.result;
                    break;
                }
                // fallback to unknown command
                result = await unknown_command(config, commands);
            }
            break;
    }
    WorkerController.exit();
    const duration = nano_to_milli(process.hrtime.bigint() - start);
    const duration_text = `${Math.round(duration)} ${Logger.color.dim('ms')}`;
    Logger.success('total execution time', duration_text);
    return { result, duration };
}

/**
 * Executes a custom command.
 *
 * @param {object} config - The configuration object.
 * @param {string} command - The command to execute.
 * @param {object} commands - The commands object containing custom commands.
 * @returns {Promise<object|undefined>} - A promise that resolves to an object with the result of the command execution, or undefined if the command is not valid.
 */
export async function execute_custom_command(config, command, commands) {
    if (!filled_string(command) || !is_func(commands?.custom?.[command]?.execute)) {
        return undefined;
    }
    const build_id = UniqId.load();
    const result = await commands.custom[command].execute(get_config_data(config, build_id));
    return { executed: true, result };
}
