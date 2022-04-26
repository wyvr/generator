import { strictEqual, deepStrictEqual } from 'assert';
import { existsSync, mkdirSync, rmdirSync } from 'fs';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { get_config_data } from '../../../src/action/get_config_data.js';
import { Cwd } from '../../../src/vars/cwd.js';

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
    });
    it('undefined', () => {
        deepStrictEqual(get_config_data(), {
            assets: [],
            build_id: undefined,
            cron: [],
            default_values: {},
            env: 'prod',
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
