import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { LogColor, LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';
import { fakeConsole } from './fakeConsole.js';

describe('utils/logger/block', () => {
    const C = fakeConsole();

    beforeEach(() => {
        C.start();
    });

    it('undefined', () => {
        Logger.block();
        deepStrictEqual(C.end(), [[LogIcon.block, '']]);
    });

    it('key + multiple text', () => {
        Logger.block('#', 'a', 'b');
        deepStrictEqual(C.end(), [[LogIcon.block, '# a b']]);
    });
});
