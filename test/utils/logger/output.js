import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/output', () => {
    let log, err;
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
        Logger.output();
        deepStrictEqual(result, [[undefined, '']]);
    });
    

    it('null', () => {
        Logger.output(null);
        deepStrictEqual(result, [[undefined, '']]);
    });
    it('symbol', () => {
        Logger.output(undefined, undefined, '#');
        deepStrictEqual(result, [['#', '']]);
    });
    it('symbol + text', () => {
        Logger.output(undefined, undefined, '#', 'a');
        deepStrictEqual(result, [['#', 'a']]);
    });
    it('symbol + multiple text', () => {
        Logger.output(undefined, undefined, '#', 'a', 'b');
        deepStrictEqual(result, [['#', 'a b']]);
    });
    it('no symbol + text', () => {
        Logger.output(undefined, undefined, 'a');
        deepStrictEqual(result, [['a', '']]);
    });
    it('no symbol + multiple text', () => {
        Logger.output(undefined, undefined, 'a', 'b');
        deepStrictEqual(result, [['a', 'b']]);
    });
});
