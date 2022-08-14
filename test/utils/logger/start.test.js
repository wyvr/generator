import { strictEqual, deepStrictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { EnvType } from '../../../src/struc/env.js';
import { LogColor, LogIcon } from '../../../src/struc/log.js';
import { Logger } from '../../../src/utils/logger.js';
import { to_plain } from '../../../src/utils/to.js';
import { Env } from '../../../src/vars/env.js';

describe('utils/logger/start', () => {
    let log, err;
    let result = [];

    const icon = LogIcon.start;
    const logger = Logger.create('mock', { start: () => {}, stop: () => {}, persist: () => {} });

    before(() => {
        // runs once before the first test in this block
        log = console.log;
        console.log = (...args) => {
            result.push(args.map(to_plain));
        };
        err = console.error;
        console.error = (...args) => {
            result.push(args.map(to_plain));
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

    it('undefined', () => {
        logger.start();
        deepStrictEqual(result, [[icon, '']]);
    });

    it('name', () => {
        logger.start('name');
        deepStrictEqual(result, [[icon, 'name']]);
    });
});
