import { strictEqual, deepStrictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/block', () => {
    let log, err;
    let result = [];

    const icon = kleur.blue('■');
    const color = kleur.blue;
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
        Logger.block();
        deepStrictEqual(result, [[icon, color('')]]);
    });
    

    it('null', () => {
        Logger.block(null);
        deepStrictEqual(result, [[icon, color('null')]]);
    });
    it('key', () => {
        Logger.block('#');
        deepStrictEqual(result, [[icon, color('#')]]);
    });
    it('key + text', () => {
        Logger.block('#', 'a');
        deepStrictEqual(result, [[icon, color('# a')]]);
    });
    it('key + multiple text', () => {
        Logger.block('#', 'a', 'b');
        deepStrictEqual(result, [[icon, color('# a b')]]);
    });
    it('text', () => {
        Logger.block(undefined, 'a');
        deepStrictEqual(result, [[icon, color('a')]]);
    });
    it('multiple text', () => {
        Logger.block(undefined, 'a', 'b');
        deepStrictEqual(result, [[icon, color('a b')]]);
    });
   
});
