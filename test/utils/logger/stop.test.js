import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';
import { MockSpinner } from '../spinner/MockSpinner.js';

describe('utils/logger/stop', () => {
    let spinner;
    let result;
    const logger = Logger.create('mock', {
        start: () => {},
        stop: (data) => {
            result = data;
        },
        persist: () => {},
    });

    it('undefined', () => {
        logger.stop();
        deepStrictEqual(result, undefined);
    });
    it('no spinner undefined', () => {
        const spinner = logger.spinner;
        logger.spinner = undefined;
        logger.stop();
        logger.spinner = spinner;
        deepStrictEqual(result, undefined);
    });
    it('stop with text', () => {
        const error = console.error;
        let out = [];
        console.error = (...values) => {
            out.push(values);
        };
        Logger.remove_color = true;
        Logger.stop('test', 500);
        console.error = error;
        Logger.remove_color = false;
        deepStrictEqual(out, [['✔', 'test ............................ 500 ms']]);
        out = [];
    });
});
