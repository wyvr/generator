import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { EnvType } from '../../../src/struc/env.js';
import { LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';
import { Env } from '../../../src/vars/env.js';
import { fakeConsole } from './fakeConsole.js';

describe('utils/logger/debug', () => {
    const icon = LogIcon.debug;

    const C = fakeConsole();

    beforeEach(() => {
        C.start();
        Env.set(EnvType.debug);
    });
    afterEach(() => {
        Env.set(EnvType.prod);
    });

    it('hide in prod mode', () => {
        Env.set(EnvType.prod);
        Logger.debug('#');
        deepStrictEqual(C.end(), []);
    });

    it('undefined', () => {
        Logger.debug();
        deepStrictEqual(C.end(), [[icon, '']]);
    });

    it('key + multiple text', () => {
        Logger.debug('#', 'a', 'b');
        deepStrictEqual(C.end(), [[icon, '# a b']]);
    });
});
