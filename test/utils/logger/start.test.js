import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { EnvType } from '../../../src/struc/env.js';
import { LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';
import { Env } from '../../../src/vars/env.js';
import { fakeConsole } from './fakeConsole.js';

describe('utils/logger/start', () => {
    const C = fakeConsole();

    beforeEach(() => {
        C.start();
        Env.set(EnvType.dev);
    });
    const icon = LogIcon.start;
    const logger = Logger.create('mock', { start: () => {}, stop: () => {}, persist: () => {} });

    afterEach(() => {
        Env.set(EnvType.prod);
    });

    it('undefined', () => {
        logger.start();
        deepStrictEqual(C.end(), [[icon, '']]);
    });

    it('name', () => {
        logger.start('name');
        deepStrictEqual(C.end(), [[icon, 'name']]);
    });
});
