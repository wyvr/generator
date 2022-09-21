import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Cwd } from '../../../src/vars/cwd.js';
import { collect_packages } from '../../../src/action/package.js';
import { join } from 'path';
import { Config } from '../../../src/utils/config.js';
import { to_dirname } from '../../../src/utils/to.js';

describe('action/package/collect_packages', () => {
    const cwd = Cwd.get();
    const config = Config.get();
    const __dirname = to_dirname(import.meta.url);

    const empty_disabled_packages = (cwd) => [
        {
            name: 'wyvr',
            path: cwd + '/node_modules/@wyvr/generator/src/boilerplate',
        },
    ];

    afterEach(() => {
        Cwd.set(cwd);
        Config.replace(config);
    });
    it('empty', async () => {
        Cwd.set(join(__dirname, '_tests/empty'));
        const result = await collect_packages();
        deepStrictEqual(result, { available_packages: [], disabled_packages: empty_disabled_packages(Cwd.get()) });
    });
    it('empty with package.json', async () => {
        Cwd.set(join(__dirname, '_tests/empty'));
        const result = await collect_packages({ dependencies: { nope: '0.0.0' } });
        deepStrictEqual(result, { available_packages: [], disabled_packages: empty_disabled_packages(Cwd.get()) });
    });
    it('simple', async () => {
        Cwd.set(join(__dirname, '_tests/simple'));
        const result = await collect_packages();
        deepStrictEqual(result, {
            available_packages: [{ name: 'local', path: join(Cwd.get(), 'local') }],
            disabled_packages: empty_disabled_packages(Cwd.get()),
        });
        deepStrictEqual(Config.get('test'), true);
    });
    it('symlinked', async () => {
        Cwd.set(join(__dirname, '_tests/symlinked'));
        const result = await collect_packages({ dependencies: { local: '0.0.0', file2: 'file:./node_modules/file' } });
        deepStrictEqual(result, {
            available_packages: [
                { name: 'local', path: join(Cwd.get(), 'node_modules/local') },
                { name: 'file2', path: join(Cwd.get(), 'node_modules/file') },
            ],
            disabled_packages: empty_disabled_packages(Cwd.get()),
        });
    });
    it('symlinked without package.json', async () => {
        Cwd.set(join(__dirname, '_tests/symlinked'));
        const result = await collect_packages({});
        deepStrictEqual(result, {
            available_packages: [{ name: 'local', path: join(Cwd.get(), 'node_modules/local') }],
            disabled_packages: [].concat([{ name: 'file2' }], empty_disabled_packages(Cwd.get())),
        });
    });
    it('disabled', async () => {
        Cwd.set(join(__dirname, '_tests/disabled'));
        const result = await collect_packages();
        deepStrictEqual(result, {
            available_packages: [],
            disabled_packages: [].concat(empty_disabled_packages(Cwd.get()), [
                { name: 'local', path: join(Cwd.get(), 'local') },
                { name: '#2', path: join(Cwd.get(), 'path') },
            ]),
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
