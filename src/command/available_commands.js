import { LogType } from '../struc/log.js';
import { Logger } from '../utils/logger.js';
import { is_array } from '../utils/validate.js';

export const available_commands = {
    app: {
        desc: 'run as a service for server side execution',
        flags: [
            {
                key: 'single',
                desc: 'run the generator in single threaded mode only recommended for debugging purposes'
            }
        ]
    },
    build: {
        desc: 'statically generate site',
        flags: [
            {
                key: 'single',
                desc: 'run the generator in single threaded mode only recommended for debugging purposes'
            }
        ]
    },
    clear: {
        desc: 'clear the caches and generated data',
        flags: [
            {
                key: 'hard',
                desc: 'delete cache, gen and storage'
            },
            {
                key: 'cache',
                desc: 'delete cache files'
            },
            {
                key: 'gen',
                desc: 'delete generated files'
            },
            {
                key: 'media',
                desc: 'deletes all generated media files, not included in hard'
            },
            {
                key: 'storage',
                desc: 'delete storage databases'
            }
        ]
    },
    cron: {
        desc: 'execute the cronjobs',
        flags: []
    },
    create: {
        desc: 'scaffold new projects and files',
        flags: []
    },
    dev: {
        desc: 'build the site in development mode and rebuild when changes are made',
        flags: [
            {
                key: 'fast',
                desc: 'fast starting watch server without building the site'
            }
        ]
    },
    health: {
        desc: 'show health infos about the current setup',
        flags: []
    },
    help: {
        desc: 'show available commands and flags',
        flags: []
    },
    info: {
        desc: 'show basic information about node version, wyvr version and the current working directory',
        flags: []
    },
    version: {
        desc: 'show wyvr version',
        flags: []
    }
};

export const global_flags = [
    {
        key: 'debug',
        desc: 'set the environment to development mode and show debug messages'
    },
    {
        key: 'dev',
        desc: 'set the environment to development mode'
    },
    {
        key: 'plain',
        desc: 'remove colors from the logger'
    },
    {
        key: 'prod',
        desc: 'set the environment to production mode'
    },
    {
        key: 'silent',
        desc: 'the logger does not print messages to stdout'
    },
    {
        key: 'single',
        desc: 'run the generator in single threaded mode'
    },
    {
        key: 'worker',
        desc: 'set the worker ratio, value from 0-1, use 0.5 for 50% of the available threads'
    },
    {
        key: 'log_file',
        desc: 'write log output to get given file'
    },
    {
        key: 'log_level',
        desc: `set the log level when writing log file, available options ${Object.keys(LogType).join(',')}`
    }
];

export function show_help(config) {
    let commands = available_commands;
    let flags = global_flags;
    if (is_array(config?.search)) {
        // check if command was found with the text
        const found_commands_object = {};
        const found_commands = Object.keys(available_commands).filter((key) => {
            const found = config.search.find((c) => key.indexOf(c) !== -1);
            if (found) {
                found_commands_object[key] = available_commands[key];
            }
            return found;
        });
        if (found_commands.length > 0) {
            flags = undefined;
            Logger.info('did you mean?');
            commands = found_commands_object;
        } else {
            // check if description was found with the text
            const found_desc_object = {};
            const found_desc = Object.keys(available_commands).filter((key) => {
                const found = config.search.find((c) => available_commands[key].desc.toLowerCase().indexOf(c) !== -1);
                if (found) {
                    found_desc_object[key] = available_commands[key];
                }
                return found;
            });
            if (found_desc.length > 0) {
                flags = undefined;
                Logger.info('did you mean?');
                commands = found_desc_object;
            }
        }
    }
    Logger.start('commands');
    for (const key of Object.keys(commands)) {
        show_command(key, config);
    }
    Logger.stop('commands');
    if (config?.flags && flags) {
        Logger.start('global flags');
        for (const flag of flags) {
            show_flag(flag.key, flag.desc);
        }
        Logger.stop('global flags');
    }
}

export function show_command(key, config = {}) {
    Logger.present(key, available_commands[key].desc);
    if (config?.flags) {
        for (const flag of available_commands[key].flags) {
            show_flag(flag.key, flag.desc);
        }
    }
}

export function show_flag(key, desc) {
    Logger.log(`  --${key} ${Logger.color.dim(desc)}`);
}
