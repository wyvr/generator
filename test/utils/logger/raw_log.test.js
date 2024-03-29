import { strictEqual, deepStrictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/raw_log', () => {
    let log;
    let err;
    let result = [];

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
        Logger.raw_log();
        deepStrictEqual(result, [['', '']]);
    });

    it('key + multiple text', () => {
        Logger.raw_log('#', 'a', 'b');
        deepStrictEqual(result, [['#', 'a b']]);
    });  
   
   
});
