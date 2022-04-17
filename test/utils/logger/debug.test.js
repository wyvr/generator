import { strictEqual, deepStrictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { EnvType } from '../../../src/struc/env.js';
import { LogColor, LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';
import { Env } from '../../../src/vars/env.js';

describe('utils/logger/debug', () => {
    let log, err;
    let result = [];

    const icon = LogColor.debug(LogIcon.debug);
    const color = LogColor.debug;

    before(() => {
        // runs once before the first test in this block
        log = console.log;
        console.log = (...args) => {
            result.push(args);
        };
        err = console.error;
        console.error = (...args) => {
            result.push(args);
        };
    });
    beforeEach(() => {
        Env.set(EnvType.debug);
    });
    afterEach(() => {
        result = [];
        Env.set(EnvType.prod);
    });
    after(() => {
        // runs once after the last test in this block
        console.log = log;
        console.error = err;
    });

    it('hide in prod mode', () => {
        Env.set(EnvType.prod);
        Logger.debug('#');
        deepStrictEqual(result, []);
    });

    it('undefined', () => {
        Logger.debug();
        deepStrictEqual(result, [[icon, color('')]]);
    });

    it('key + multiple text', () => {
        Logger.debug('#', 'a', 'b');
        deepStrictEqual(result, [[icon, color('# a b')]]);
    });
});
