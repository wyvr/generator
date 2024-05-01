import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';
import { fakeConsole } from './fakeConsole.js';

describe('utils/logger/log', () => {
    const C = fakeConsole();

    beforeEach(() => {
        C.start();
    });

    it('undefined', () => {
        Logger.log();
        deepStrictEqual(C.end(), [['-', '']]);
    });

    it('key + multiple text', () => {
        Logger.log('#', 'a', 'b');
        deepStrictEqual(C.end(), [['-', '# a b']]);
    });
});
