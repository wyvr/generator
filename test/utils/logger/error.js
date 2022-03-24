import { strictEqual, deepStrictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/error', () => {
    let log, err;
    let result = [];

    const icon = kleur.red('✖');
    const color = kleur.red;
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
    afterEach(() => {
        result = [];
    });
    after(() => {
        // runs once after the last test in this block
        console.log = log;
        console.error = err;
    });
    it('undefined', () => {
        Logger.error();
        deepStrictEqual(result, [[icon, color('')]]);
    });
    

    it('null', () => {
        Logger.error(null);
        deepStrictEqual(result, [[icon, color('null')]]);
    });
    it('key', () => {
        Logger.error('#');
        deepStrictEqual(result, [[icon, color('#')]]);
    });
    it('key + text', () => {
        Logger.error('#', 'a');
        deepStrictEqual(result, [[icon, color('# a')]]);
    });
    it('key + multiple text', () => {
        Logger.error('#', 'a', 'b');
        deepStrictEqual(result, [[icon, color('# a b')]]);
    });
    it('text', () => {
        Logger.error(undefined, 'a');
        deepStrictEqual(result, [[icon, color('a')]]);
    });
    it('multiple text', () => {
        Logger.error(undefined, 'a', 'b');
        deepStrictEqual(result, [[icon, color('a b')]]);
    });
   
});
