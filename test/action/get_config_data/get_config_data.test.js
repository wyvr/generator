import { strictEqual, deepStrictEqual } from 'assert';
import { existsSync, mkdirSync, rmdirSync } from 'fs';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { get_config_data } from '../../../src/action/get_config_data.js';
import { EnvType } from '../../../src/struc/env.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { Env } from '../../../src/vars/env.js';

describe('action/get_config_data/get_config_data', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));
    const __root = join(__dirname, '..', '..', '..');
    const __path = join('test', 'action', 'get_config_data', '_tests', 'get_config_data');
    const test_folder = join(__root, __path);

    before(() => {
        Cwd.set(__root);
    });
    beforeEach(() => {
        mkdirSync(test_folder, { recursive: true });
    });
    afterEach(() => {
        if (existsSync(test_folder)) {
            rmdirSync(test_folder, { recursive: true, force: true });
        }
    });
    after(() => {
        Cwd.set(undefined);
        Env.set(EnvType.prod);
    });
    it('undefined', () => {
        deepStrictEqual(get_config_data(), {
            assets: [],
            build_id: undefined,
            cron: [],
            cwd: __root,
            default_values: {},
            env: 'prod',
            https: true,
            packages: undefined,
            releases: {
                keep: 0,
            },
            url: 'localhost',
            worker: {
                force_initial_build: false,
                ratio: 0,
            },
        });
    });
    it('cli_config', () => {
        deepStrictEqual(
            get_config_data({
                cli: {
                    cwd: __root,
                    interpreter: '/bin/node',
                    script: join(__root, 'bin/index.js'),
                    command: ['build'],
                    flags: undefined,
                },
                version: '0.0.0',
            }),
            {
                assets: [],
                build_id: undefined,
                cron: [],
                cli: {
                    cwd: __root,
                    interpreter: '/bin/node',
                    script: join(__root, 'bin/index.js'),
                    command: ['build'],
                    flags: undefined,
                },
                cwd: __root,
                default_values: {},
                env: 'prod',
                https: true,
                packages: undefined,
                releases: {
                    keep: 0,
                },
                url: 'localhost',
                version: '0.0.0',
                worker: {
                    force_initial_build: false,
                    ratio: 0,
                },
            }
        );
    });
    it('build id', () => {
        deepStrictEqual(get_config_data(undefined, '012345'), {
            assets: [],
            build_id: '012345',
            cron: [],
            cwd: __root,
            default_values: {},
            env: 'prod',
            https: true,
            packages: undefined,
            releases: {
                keep: 0,
            },
            url: 'localhost',
            worker: {
                force_initial_build: false,
                ratio: 0,
            },
        });
    });
    it('override env dev', () => {
        deepStrictEqual(get_config_data({ cli: { flags: { dev: true } } }, '012345'), {
            assets: [],
            build_id: '012345',
            cli: { flags: { dev: true } },
            cron: [],
            cwd: __root,
            default_values: {},
            env: 'dev',
            https: true,
            packages: undefined,
            releases: {
                keep: 0,
            },
            url: 'localhost',
            worker: {
                force_initial_build: false,
                ratio: 0,
            },
        });
    });
    it('override env debug', () => {
        deepStrictEqual(get_config_data({ cli: { flags: { dev: true, debug: true } } }, '012345'), {
            assets: [],
            build_id: '012345',
            cli: { flags: { dev: true, debug: true } },
            cron: [],
            cwd: __root,
            default_values: {},
            env: 'debug',
            https: true,
            packages: undefined,
            releases: {
                keep: 0,
            },
            url: 'localhost',
            worker: {
                force_initial_build: false,
                ratio: 0,
            },
        });
    });
});