import { COMMANDS } from '../constants/commands.js';
import { FOLDER_GEN_COMMANDS } from '../constants/folder.js';
import { get_error_message } from '../utils/error.js';
import { collect_files } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { is_func } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';

export async function get_package_commands() {
    const commands = {};
    const command_files = collect_files(FOLDER_GEN_COMMANDS, '.js');
    if (command_files.length === 0) {
        return undefined;
    }
    for (const command_file of command_files) {
        const short_name = command_file.replace(FOLDER_GEN_COMMANDS, '').replace(/^\//, '');
        const command_name = short_name.replace('.js', '');
        try {
            const module = await import(Cwd.get(command_file));
            if (!is_func(module.execute)) {
                Logger.warning('command', command_name, 'is ignored because it has no exported function execute');
                continue;
            }
            commands[command_name] = {
                desc: module.meta?.desc || '',
                flags: module.meta?.flags || [],
                execute: module.execute
            };
        } catch (error) {
            Logger.error(get_error_message(error, short_name, 'command'));
        }
    }
    return commands;
}

export async function get_commands(search) {
    const custom_commands = await get_package_commands();
    if (!search) {
        return { builtin: COMMANDS, custom: custom_commands };
    }
    const commands = { builtin: {}, custom: {} };
    for (const key of Object.keys(COMMANDS)) {
        if (search && key.indexOf(search) === -1) {
            continue;
        }
        commands.builtin[key] = COMMANDS[key];
    }
    if (custom_commands) {
        for (const key of Object.keys(custom_commands)) {
            if (search && key.indexOf(search) === -1) {
                continue;
            }
            commands.custom[key] = custom_commands[key];
        }
    }
    return commands;
}
