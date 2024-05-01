import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';
import { fakeConsole } from './fakeConsole.js';
import { to_plain } from '../../../src/utils/to.js';

describe('utils/logger/info', () => {
    const C = fakeConsole();

    beforeEach(() => {
        C.start();
    });

    const icon = to_plain(LogIcon.info);

    it('undefined', () => {
        Logger.info();
        deepStrictEqual(C.end(), [[icon, '']]);
    });

    it('key + multiple text', () => {
        Logger.info('#', 'a', 'b');
        deepStrictEqual(C.end(), [[icon, '# a b']]);
    });
});
