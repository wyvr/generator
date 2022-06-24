import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { Plugin } from '../../../src/utils/plugin.js';
import { to_dirname } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/plugin/process', () => {
    const __dirname = to_dirname(import.meta.url);
    let logger_messages = [];
    before(() => {
        Cwd.set(process.cwd());
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            logger_messages.push(msg);
        });
    });
    afterEach(() => {
        logger_messages = [];
        Plugin.clear();
    });
    after(() => {
        console.error.restore();
        Cwd.set(undefined);
    });
    it('undefined', async () => {
        const plugin = await Plugin.process('a', 1, 2);
        strictEqual(typeof plugin, 'function');
        const { args, error } = await plugin();
        deepStrictEqual(error, 'missing plugin function');
        deepStrictEqual(args, [1, 2]);
        deepStrictEqual(logger_messages, []);
    });
});
