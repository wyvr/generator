import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';
import { fakeConsole } from './fakeConsole.js';
import { to_plain } from '../../../src/utils/to.js';

describe('utils/logger/success', () => {
    const C = fakeConsole();

    beforeEach(() => {
        C.start();
    });

    const icon = to_plain(LogIcon.success);

    it('undefined', () => {
        Logger.success();
        deepStrictEqual(C.end(), [[icon, '']]);
    });

    it('key + multiple text', () => {
        Logger.success('#', 'a', 'b');
        deepStrictEqual(C.end(), [[icon, '# a b']]);
    });
});
