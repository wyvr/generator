import { GLOBAL_FLAGS } from '../constants/commands.js';
import { Logger } from '../utils/logger.js';
import { filled_array, filled_object, is_array } from '../utils/validate.js';

export async function help_command(config, commands) {
    const search = config?.cli?.command?.slice(1);
    if (search.length > 0) {
        Logger.info('show help for', search.join(' '));
    }
    await show_help(
        {
            flags: true,
            search: search.length > 0 ? search : undefined,
        },
        commands
    );
    Logger.info('visit https://wyvr.dev for more infos');
    return '';
}

export async function show_help(config, commands) {
    let selected_commands = { builtin: {}, custom: {} };
    const is_searching = is_array(config?.search) && config.search.length > 0;
    let found_something = false;
    let exact_match = false;
    const fn_match = (key) => {
        return config.search.find((c) => {
            const found = key.indexOf(c) !== -1;
            if (found && key === c) {
                exact_match = true;
            }
            return found;
        });
    };
    const fn_match_unsave = (scoped_commands, key) => {
        return config.search.find(
            (c) => (scoped_commands[key]?.desc ?? '').indexOf(c) !== -1
        );
    };
    if (is_searching) {
        // check if builtin commands contains the text
        if (commands?.builtin) {
            for (const key of Object.keys(commands.builtin)) {
                if (fn_match(key)) {
                    selected_commands.builtin[key] = commands.builtin[key];
                    found_something = true;
                }
            }
        }
        if (commands?.custom) {
            // check if custom commands contains the text
            for (const key of Object.keys(commands?.custom)) {
                if (fn_match(key)) {
                    selected_commands.custom[key] = commands.custom[key];
                    found_something = true;
                }
            }
        }

        // if nothing was found try searching the descrioptions
        if (!found_something) {
            if (commands?.builtin) {
                for (const key of Object.keys(commands?.builtin)) {
                    if (fn_match_unsave(key)) {
                        selected_commands.builtin[key] = commands.builtin[key];
                        found_something = true;
                    }
                }
            }
            if (commands?.custom) {
                for (const key of Object.keys(commands?.custom)) {
                    if (fn_match_unsave(key)) {
                        selected_commands.custom[key] = commands.custom[key];
                        found_something = true;
                    }
                }
            }
        }
        if (!found_something) {
            const has_command = config?.search.length > 0;
            if (!has_command) {
                Logger.error('command is missing');
            }
        }
    } else {
        selected_commands = commands;
    }

    if (filled_object(selected_commands.builtin)) {
        Logger.block('builtin commands');
        Logger.inset = true;
        for (const [key, command] of Object.entries(
            selected_commands.builtin
        )) {
            show_command(key, command, config);
        }
        Logger.inset = false;
    }
    if (filled_object(selected_commands.custom)) {
        Logger.block('custom commands');
        Logger.inset = true;
        for (const [key, command] of Object.entries(selected_commands.custom)) {
            show_command(key, command, config);
        }
        Logger.inset = false;
    }

    if (config?.flags && !is_searching) {
        Logger.block('global flags');
        Logger.inset = true;
        for (const flag of GLOBAL_FLAGS) {
            show_flag(flag.key, flag.desc);
        }
        Logger.inset = false;
    }
    const matching_commands = [].concat(
        Object.keys(selected_commands.builtin),
        Object.keys(selected_commands.custom ?? {})
    );
    return {
        command:
            matching_commands.length === 1 ? matching_commands[0] : undefined,
        exact_match,
    };
}

export function show_command(key, command, config = {}) {
    let name = key;
    if (is_array(config?.search)) {
        for (const search of config.search) {
            name = name.replace(new RegExp(`(${search})`, 'gi'), (_) =>
                Logger.color.bgBlue(_)
            );
        }
    }
    Logger.present(name, command?.desc);
    if (config?.flags && filled_array(command.flags)) {
        for (const flag of command.flags) {
            show_flag(flag.key, flag.desc);
        }
    }
}

export function show_flag(key, desc) {
    Logger.output(undefined, undefined, `  --${key} ${Logger.color.dim(desc)}`);
}
