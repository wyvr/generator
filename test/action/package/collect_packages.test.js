import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { Cwd } from '../../../src/vars/cwd.js';
import { collect_packages } from '../../../src/action/package.js';
import { join } from 'node:path';
import { Config } from '../../../src/utils/config.js';
import { to_dirname } from '../../../src/utils/to.js';
import { fakeConsole } from '../../utils/logger/fakeConsole.js';

describe('action/package/collect_packages', () => {
    const cwd = Cwd.get();
    const config = Config.get();
    const __dirname = to_dirname(import.meta.url);

    const C = fakeConsole();

    beforeEach(() => {
        C.start();
    });

    const empty_disabled_packages = (cwd) => [
        {
            name: 'wyvr',
            path: `${cwd}/node_modules/@wyvr/generator/src/boilerplate`
        }
    ];

    afterEach(() => {
        Cwd.set(cwd);
        Config.replace(config);
    });
    it('empty', async () => {
        Cwd.set(join(__dirname, '_tests/empty'));
        const result = await collect_packages(undefined, false);
        deepStrictEqual(result, { available_packages: [], disabled_packages: empty_disabled_packages(Cwd.get()) });
    });
    it('empty with package.json', async () => {
        Cwd.set(join(__dirname, '_tests/empty'));
        const result = await collect_packages({ dependencies: { nope: '0.0.0' } }, false);
        deepStrictEqual(result, { available_packages: [], disabled_packages: empty_disabled_packages(Cwd.get()) });
    });
    it('package without content', async () => {
        Cwd.set(join(__dirname, '_tests/empty_package'));
        const result = await collect_packages({ dependencies: { nope: '0.0.0' } }, false);
        deepStrictEqual(result, {
            available_packages: [],
            disabled_packages: [
                {
                    name: 'empty',
                    path: `${Cwd.get()}/empty`
                }
            ].concat(empty_disabled_packages(Cwd.get()))
        });
        deepStrictEqual(C.end(), [['⚠', 'package empty is empty']]);
    });
    it('simple', async () => {
        Cwd.set(join(__dirname, '_tests/simple'));
        const result = await collect_packages(undefined, false);
        deepStrictEqual(result, {
            available_packages: [{ name: 'local', path: join(Cwd.get(), 'local') }],
            disabled_packages: empty_disabled_packages(Cwd.get())
        });
        deepStrictEqual(Config.get('test'), true);
    });
    it('symlinked', async () => {
        Cwd.set(join(__dirname, '_tests/symlinked'));
        const result = await collect_packages({ dependencies: { local: '0.0.0', file2: 'file:./node_modules/file' } }, false);
        deepStrictEqual(result, {
            available_packages: [
                { name: 'local', path: join(Cwd.get(), 'node_modules/local') },
                { name: 'file2', path: join(Cwd.get(), 'node_modules/file') }
            ],
            disabled_packages: empty_disabled_packages(Cwd.get())
        });
    });
    it('symlinked without package.json', async () => {
        Cwd.set(join(__dirname, '_tests/symlinked'));
        const result = await collect_packages({}, false);
        deepStrictEqual(result, {
            available_packages: [{ name: 'local', path: join(Cwd.get(), 'node_modules/local') }],
            disabled_packages: [].concat([{ name: 'file2' }], empty_disabled_packages(Cwd.get()))
        });
    });
    it('subpackages', async () => {
        Cwd.set(join(__dirname, '_tests/subpackages'));
        const result = await collect_packages(undefined, false);
        deepStrictEqual(result, {
            available_packages: [
                { name: 'direct', path: join(Cwd.get(), 'direct') },
                { name: 'local', path: join(Cwd.get(), '..', 'simple', 'local') }
            ],
            disabled_packages: empty_disabled_packages(Cwd.get())
        });
        deepStrictEqual(Config.get('test'), true);
    });
    it('disabled', async () => {
        Cwd.set(join(__dirname, '_tests/disabled'));
        const result = await collect_packages(undefined, false);
        deepStrictEqual(result, {
            available_packages: [],
            disabled_packages: [].concat(
                [
                    { name: 'local', path: 'local' },
                    { name: '#1', path: 'path' }
                ],
                empty_disabled_packages(Cwd.get())
            )
        });
    });
    // it('missing package.json', async () => {
    //     Cwd.set(join(__dirname, '_tests', 'empty'));
    //     const report = await check_env();
    //     strictEqual(report.warning.indexOf(ERRORS.package_is_not_present) > -1, true);
    // });
    // it('invalid package.json', async () => {
    //     Cwd.set(join(__dirname, '_tests', 'invalid'));
    //     const report = await check_env();
    //     strictEqual(report.warning.indexOf(ERRORS.package_is_not_valid) > -1, true);
    // });
    // it('missing wyvr.js', async () => {
    //     Cwd.set(join(__dirname, '_tests', 'empty'));
    //     const report = await check_env();
    //     strictEqual(report.error.indexOf(ERRORS.wyvr_js_is_not_present) > -1, true);
    // });
});
