import { deepStrictEqual } from 'node:assert';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { get_config_data } from '../../../src/action/get_config_data.js';
import { EnvType } from '../../../src/struc/env.js';
import { Logger } from '../../../src/utils/logger.js';
import { to_dirname } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { Env } from '../../../src/vars/env.js';

describe('action/get_config_data/get_config_data', () => {
    const __dirname = to_dirname(import.meta.url);
    const __root = join(__dirname, '..', '..', '..');
    const __path = join(
        'test',
        'action',
        'get_config_data',
        '_tests',
        'get_config_data'
    );
    const test_folder = join(__root, __path);

    before(() => {
        Cwd.set(__root);
    });
    beforeEach(() => {
        mkdirSync(test_folder, { recursive: true });
    });
    afterEach(() => {
        if (existsSync(test_folder)) {
            rmSync(test_folder, { recursive: true, force: true });
        }
    });
    after(() => {
        Cwd.set(undefined);
        Env.set(EnvType.prod);
    });
    it('undefined', () => {
        deepStrictEqual(get_config_data(), {
            build_id: undefined,
            cwd: __root,
            env: 'prod',
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
                build_id: undefined,
                cli: {
                    cwd: __root,
                    interpreter: '/bin/node',
                    script: join(__root, 'bin/index.js'),
                    command: ['build'],
                    flags: undefined,
                },
                cwd: __root,
                env: 'prod',
                version: '0.0.0',
            }
        );
    });
    it('build id', () => {
        deepStrictEqual(get_config_data(undefined, '012345'), {
            build_id: '012345',
            cwd: __root,
            env: 'prod',
        });
    });
    it('override env dev', () => {
        deepStrictEqual(
            get_config_data({ cli: { flags: { dev: true } } }, '012345'),
            {
                build_id: '012345',
                cli: { flags: { dev: true } },
                cwd: __root,
                env: 'dev',
            }
        );
    });
    it('override env debug', () => {
        deepStrictEqual(
            get_config_data(
                { cli: { flags: { dev: true, debug: true } } },
                '012345'
            ),
            {
                build_id: '012345',
                cli: { flags: { dev: true, debug: true } },
                cwd: __root,
                env: 'debug',
            }
        );
    });
    it('override plain output', () => {
        get_config_data({ cli: { flags: { plain: true } } }, '012345');
        deepStrictEqual(Logger.remove_color, true);
        Logger.remove_color = false;
    });
});
