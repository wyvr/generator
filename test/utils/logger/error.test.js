import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';
import { fakeConsole } from './fakeConsole.js';

describe('utils/logger/error', () => {
    const icon = LogIcon.error;
    const C = fakeConsole();

    beforeEach(() => {
        C.start();
    });
    it('undefined', () => {
        Logger.error();
        deepStrictEqual(C.end(), [[icon, '']]);
    });

    it('key + multiple text', () => {
        Logger.error('#', 'a', 'b');
        deepStrictEqual(C.end(), [[icon, '# a b']]);
    });
});
