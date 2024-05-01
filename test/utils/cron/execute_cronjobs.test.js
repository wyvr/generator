import { deepStrictEqual } from 'node:assert';
import { execute_cronjobs } from '../../../src/utils/cron.js';
import { join } from 'node:path';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('execute_cronjobs', function () {
    let log = [];
    let console_error, console_log;
    const cwd = process.cwd();
    const __dirname = join(to_dirname(import.meta.url), '_tests');
    before(() => {
        Cwd.set(__dirname);
        console_error = console.error;
        console.error = (...values) => {
            log.push(values.map(to_plain));
        };
        console_log = console.log;
        console.log = (...values) => {
            log.push(values.map(to_plain));
        };
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        console.error = console_error;
        console.log = console_log;
        Cwd.set(undefined);
    });

    it('undefined', async () => {
        const result = await execute_cronjobs();
        deepStrictEqual(result, []);
        deepStrictEqual(log, []);
    });
    it('empty', async () => {
        const result = await execute_cronjobs([]);
        deepStrictEqual(result, []);
        deepStrictEqual(log, []);
    });
    it('run script', async () => {
        const result = await execute_cronjobs([
            {
                name: 'script',
                what: 'script.js',
            },
        ]);
        deepStrictEqual(result, [
            {
                name: 'script',
                what: 'script.js',
                result: [true],
            },
        ]);
        deepStrictEqual(log, [['⬢', 'cron job script']]);
    });
    it('run async script', async () => {
        const result = await execute_cronjobs([
            {
                name: 'script',
                what: 'async.js',
            },
        ]);
        deepStrictEqual(result, [
            {
                name: 'script',
                what: 'async.js',
                result: [true],
            },
        ]);
        deepStrictEqual(log, [['⬢', 'cron job script']]);
    });
    it('error in script', async () => {
        const result = await execute_cronjobs([
            {
                name: 'script',
                what: 'error.js',
            },
        ]);
        deepStrictEqual(result, [
            {
                name: 'script',
                what: 'error.js',
                failed: true,
                result: undefined,
            },
        ]);
        deepStrictEqual(log, [
            ['⬢', 'cron job script'],
            [
                '✖',
                '@cron script\n' +
                    '[Error] error\n' +
                    'stack\n' +
                    '- Module.default (file://cron/error.js:2:11)\n' +
                    'source gen/cron/error.js',
            ],
        ]);
    });
    it('no what', async () => {
        const result = await execute_cronjobs([
            {
                name: 'script',
            },
        ]);
        deepStrictEqual(result, [
            {
                name: 'script',
                failed: true,
                result: undefined,
            },
        ]);
        deepStrictEqual(log, [['⚠', 'cron job script has no script assigned']]);
    });
    it('run multiple scripts', async () => {
        const result = await execute_cronjobs([
            {
                name: 'script',
                what: ['script.js', 'script.js'],
            },
        ]);
        deepStrictEqual(result, [
            {
                name: 'script',
                what: ['script.js', 'script.js'],
                result: [true, true],
            },
        ]);
        deepStrictEqual(log, [['⬢', 'cron job script with 2 scripts']]);
    });
});
