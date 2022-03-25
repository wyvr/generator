import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/output_type', () => {
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
        Logger.output_type();
        deepStrictEqual(result, [['', '']]);
    });

    it('no value', () => {
        Logger.output_type('log', 'key');
        deepStrictEqual(result, [['key', '']]);
    });

    it('log one value', () => {
        Logger.output_type('log', 'key', 'val1');
        deepStrictEqual(result, [['key', 'val1']]);
    });

    it('log two values', () => {
        Logger.output_type('log', 'key', 'val1', 'val2');
        deepStrictEqual(result, [['key', 'val1 val2']]);
    });
});
