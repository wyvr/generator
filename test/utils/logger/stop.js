import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';

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
});
