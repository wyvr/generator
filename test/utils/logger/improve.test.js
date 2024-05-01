import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';
import { fakeConsole } from './fakeConsole.js';

describe('utils/logger/improve', () => {
    const C = fakeConsole();

    beforeEach(() => {
        C.start();
    });

    const icon = LogIcon.improve;

    it('undefined', () => {
        Logger.improve();
        deepStrictEqual(C.end(), [[icon, '']]);
    });

    it('key + multiple text', () => {
        Logger.improve('#', 'a', 'b');
        deepStrictEqual(C.end(), [[icon, '# a b']]);
    });
});
