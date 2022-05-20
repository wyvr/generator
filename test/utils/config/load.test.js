import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import Sinon from 'sinon';
import { Config } from '../../../src/utils/config.js';
import { to_dirname } from '../../../src/utils/to.js';

describe('utils/config/load', () => {
    const __dirname = to_dirname(import.meta.url);
    let logger_messages = [];
    before(() => {
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            logger_messages.push(msg);
        });
    });
    afterEach(() => {
        logger_messages = [];
    });
    after(() => {
        console.error.restore();
    });

    it('undefined', async () => {
        const config = await Config.load();
        deepStrictEqual(config, {});
    });
    it('non existing', async () => {
        const config = await Config.load(join(__dirname, '_tests/non_existing/'));
        deepStrictEqual(config, {});
    });
    it('empty', async () => {
        const config = await Config.load(join(__dirname, '_tests/empty/'));
        deepStrictEqual(config, {});
    });
    it('simple', async () => {
        const config = await Config.load(join(__dirname, '_tests/simple/'));
        deepStrictEqual(config, { url: 'simple' });
    });
    it('dynamic', async () => {
        const config = await Config.load(join(__dirname, '_tests/dynamic/'));
        deepStrictEqual(config, { url: 'dynamic' });
    });
    it('invalid', async () => {
        const config = await Config.load(join(__dirname, '_tests/invalid/'));
        deepStrictEqual(config, {});
        deepStrictEqual(logger_messages, [
            [
                '\x1B[33m⚠\x1B[39m',
                `\x1B[33mcan not load config from ${join(__dirname,'_tests/invalid/wyvr.js')} {}\x1B[39m`,
            ],
        ]);
    });
});
