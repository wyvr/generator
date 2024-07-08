import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import Sinon from 'sinon';
import { Config } from '../../../src/utils/config.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/config/load', () => {
    const __dirname = to_dirname(import.meta.url);
    const __root = join(__dirname, '..', '..', '..');

    let logger_messages = [];
    before(() => {
        Sinon.stub(console, 'log');
        console.log.callsFake((...msg) => {
            logger_messages.push(msg.map(to_plain));
        });
        Cwd.set(process.cwd());
    });
    afterEach(() => {
        logger_messages = [];
    });
    after(() => {
        console.log.restore();
        Cwd.set(undefined);
    });

    it('undefined', async () => {
        const config = await Config.load();
        deepStrictEqual(config, {});
    });
    it('non existing', async () => {
        const config = await Config.load(
            join(__dirname, '_tests/non_existing/')
        );
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
                '✖',
                `@config\n[ReferenceError] module is not defined in ES module scope\nThis file is being treated as an ES module because it has a '.js' file extension and '${__root}/package.json\' contains "type": "module". To treat it as a CommonJS script, rename it to use the \'.cjs\' file extension.\nsource test/utils/config/_tests/invalid/wyvr.js`,
            ],
        ]);
    });
});
