import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';
import { fakeConsole } from './fakeConsole.js';

describe('utils/logger/warning', () => {
    const C = fakeConsole();

    beforeEach(() => {
        C.start();
    });

    const icon = LogIcon.warning;

    it('undefined', () => {
        Logger.warning();
        deepStrictEqual(C.end(), [[icon, '']]);
    });

    it('key + multiple text', () => {
        Logger.warning('#', 'a', 'b');
        deepStrictEqual(C.end(), [[icon, '# a b']]);
    });
});
