import { deepStrictEqual, strictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/create', () => {
    it('undefined', () => {
        const logger = Logger.create();
        strictEqual(logger.pre, '\x1B[2m[~]\x1B[22m');
    });
    it('name', () => {
        const logger = Logger.create('name');
        strictEqual(logger.pre, '\x1B[2m[name]\x1B[22m');
    });
});
