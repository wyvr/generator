import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/text', () => {
    let result;
    const logger = Logger.create('mock', {
        start: () => {},
        stop: (data) => {
            result = data;
        },
        persist: (data) => {
            result = data;
        },
        text: undefined,
        update: (text) => {
            logger.spinner.text = text;
        },
    });

    it('undefined', () => {
        logger.text();
        deepStrictEqual(result, undefined);
    });
    it('content', () => {
        logger.text('content');
        deepStrictEqual(result, undefined);
        deepStrictEqual(logger.spinner.text, 'content');
    });
});
