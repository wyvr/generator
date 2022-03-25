import { strictEqual, deepStrictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { EnvType } from '../../../src/struc/env.js';
import { LogColor, LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';
import { Env } from '../../../src/vars/env.js';

describe('utils/logger/start', () => {
    let log, err;
    let result = [];

    const icon = LogColor.start(LogIcon.start);
    const color = LogColor.start;
    const logger = Logger.create('mock', { start: () => {}, stop: () => {}, persist: () => {} });

    before(() => {
        // runs once before the first test in this block
        log = console.log;
        console.log = (...args) => {
            result.push(args);
        };
        err = console.error;
        console.error = (...args) => {
            result.push(args);
        };
    });
    beforeEach(() => {
        Env.set(EnvType.dev);
    });
    afterEach(() => {
        result = [];
        Env.set(EnvType.prod);
    });
    after(() => {
        // runs once after the last test in this block
        console.log = log;
        console.error = err;
    });

    it('hide in prod mode', () => {
        Env.set(EnvType.prod);
        logger.start('#');
        deepStrictEqual(result, []);
    });

    it('undefined', () => {
        logger.start();
        deepStrictEqual(result, [[icon, color('')]]);
    });

    it('name', () => {
        logger.start('name');
        deepStrictEqual(result, [[icon, color('name')]]);
    });
});
