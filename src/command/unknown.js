import { Logger } from '../utils/logger.js';
import { filled_array } from '../utils/validate.js';

export async function unknown_command(config) {
    let command = config?.cli?.command;
    if (!filled_array(command)) {
        command = [];
    }
    const value = command.join(' ');
    Logger.error(command.length == 0 ? 'command is missing' : `unknown command ${value}`);
    const command_map = {
        build: {
            desc: 'statically generate site',
            flags: [
                {
                    key: 'single',
                    desc: 'run the generator in single threaded mode only recommended for debugging purposes',
                },
            ],
        },
        cron: {
            desc: 'execute the cronjobs',
            flags: [],
        },
        app: {
            desc: 'run as a service for server side execution',
            flags: [
                {
                    key: 'single',
                    desc: 'run the generator in single threaded mode only recommended for debugging purposes',
                },
            ],
        },
        watch: {
            desc: 'statically generate site and watch for file changes',
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
    };
    Object.keys(command_map).forEach((key) => {
        Logger.present(key, command_map[key].desc);
    });
    process.exit(1);
}
