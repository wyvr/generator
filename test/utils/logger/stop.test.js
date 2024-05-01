import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';
import { fakeConsole } from './fakeConsole.js';

describe('utils/logger/stop', () => {
    let result;
    const C = fakeConsole();

    beforeEach(() => {
        result = undefined;
        C.start();
    });

    const logger = Logger.create('mock', {
        start: () => {},
        stop: (data) => {
            result = data;
        },
        persist: () => {}
    });

    it('undefined', () => {
        logger.stop();
        deepStrictEqual(result, undefined);
        deepStrictEqual(C.end(), []);
    });
    it('no spinner undefined', () => {
        const spinner = logger.spinner;
        logger.spinner = undefined;
        logger.stop();
        logger.spinner = spinner;
        deepStrictEqual(result, undefined);
        deepStrictEqual(C.end(), []);
    });
    it('stop with text', () => {
        Logger.remove_color = true;
        Logger.stop('test', 500);
        Logger.remove_color = false;
        deepStrictEqual(result, undefined);
        deepStrictEqual(C.end(), [['✔', 'test ............................ 500 ms']]);
    });
});
