import { Logger } from '../utils/logger.js';

export const available_commands = {
    app: {
        desc: 'run as a service for server side execution',
        flags: [
            {
                key: 'single',
                desc: 'run the generator in single threaded mode only recommended for debugging purposes',
            },
        ],
    },
    build: {
        desc: 'statically generate site',
        flags: [
            {
                key: 'single',
                desc: 'run the generator in single threaded mode only recommended for debugging purposes',
            },
        ],
    },
    clear: {
        desc: 'clear the caches and generated data',
        flags: [
            {
                key: 'hard',
                desc: 'delete everything',
            },
        ],
    },
    cron: {
        desc: 'execute the cronjobs',
        flags: [],
    },
    create: {
        desc: 'scaffold new projects and files',
        flags: [],
    },
    dev: {
        desc: 'build the site in development mode and rebuild when changes are made',
        flags: [
            {
                key: 'fast',
                desc: 'fast starting watch server without building the site',
            },
            {
                key: 'single',
                desc: 'run the generator in single threaded mode only recommended for debugging purposes',
            },
        ],
    },
    help: {
        desc: 'show available commands and flags',
        flags: [],
    },
    info: {
        desc: 'show basic information about node version, wyvr version and the current working directory',
        flags: [],
    },
    version: {
        desc: 'show wyvr version',
        flags: [],
    },
};

export function show_help(config) {
    Object.keys(available_commands).forEach((key) => {
        show_command(key, config);
    });
}

export function show_command(key, config = {}) {
    Logger.present(key, available_commands[key].desc);
    if (config?.flags) {
        available_commands[key].flags.forEach((flag) => {
            Logger.log(`  --${flag.key} ${Logger.color.dim(flag.desc)}`);
        });
    }
}
