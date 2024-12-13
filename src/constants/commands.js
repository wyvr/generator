import { LogType } from '../struc/log.js';

export const COMMANDS = {
    app: {
        desc: 'run as a service for server side execution',
        flags: [
            {
                key: 'clear',
                desc: 'delete cache, gen and storage which causes a build before starting the service'
            }
        ]
    },
    build: {
        desc: 'statically generate site',
        flags: []
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
    create: {
        desc: 'scaffold new projects and files',
        flags: []
    },
    cron: {
        desc: 'execute the cronjobs',
        flags: []
    },
    dev: {
        desc: 'build the site in development mode and rebuild when changes are made',
        flags: [
            {
                key: 'fast',
                desc: 'fast starting watch server without building the site'
            },
            {
                key: 'long',
                desc: 'avoid screen clearing after regeneration to view all logs'
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
        desc: 'show informations',
        flags: [
            {
                key: 'config',
                desc: 'show the full config'
            }
        ]
    },
    test: {
        desc: 'run all tests in the project and the packages',
        flags: []
    },
    version: {
        desc: 'show wyvr version',
        flags: []
    }
};

export const GLOBAL_FLAGS = [
    {
        key: 'debug',
        desc: 'set the environment to development mode and show debug messages'
    },
    {
        key: 'dev',
        desc: 'set the environment to development mode'
    },
    {
        key: 'help',
        desc: 'show help for the command'
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
        desc: 'run in single threaded mode'
    },
    {
        key: 'worker',
        desc: 'set the worker ratio, value from 0-1, use 0.5 for 50% of the available threads'
    },
    {
        key: 'log_file',
        desc: 'write log output to the given file'
    },
    {
        key: 'log_level',
        desc: `set the log level when writing log file, available options ${Object.keys(LogType).join(',')}`
    }
];
