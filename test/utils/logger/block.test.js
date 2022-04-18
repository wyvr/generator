import { strictEqual, deepStrictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { LogColor, LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/block', () => {
    let log, err;
    let result = [];

    const icon = LogColor.block(LogIcon.block);
    const color = LogColor.block;
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
    afterEach(() => {
        result = [];
    });
    after(() => {
        // runs once after the last test in this block
        console.log = log;
        console.error = err;
    });
    it('undefined', () => {
        Logger.block();
        deepStrictEqual(result, [[icon, color('')]]);
    });

    it('key + multiple text', () => {
        Logger.block('#', 'a', 'b');
        deepStrictEqual(result, [[icon, color('# a b')]]);
    });   
});
