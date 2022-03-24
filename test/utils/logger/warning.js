import { strictEqual, deepStrictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/warning', () => {
    let log, err;
    let result = [];

    const icon = kleur.yellow('⚠');
    const color = kleur.yellow;
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
        Logger.warning();
        deepStrictEqual(result, [[icon, '']]);
    });
    

    it('null', () => {
        Logger.warning(null);
        deepStrictEqual(result, [[icon, color('')]]);
    });
    it('key', () => {
        Logger.warning('#');
        deepStrictEqual(result, [[icon, color('#')]]);
    });
    it('key + text', () => {
        Logger.warning('#', 'a');
        deepStrictEqual(result, [[icon, color(`# ${color('a')}`)]]);
    });
    it('key + multiple text', () => {
        Logger.warning('#', 'a', 'b');
        deepStrictEqual(result, [[icon, color(`# ${color('a')} b`)]]);
    });
    it('text', () => {
        Logger.warning(undefined, 'a');
        deepStrictEqual(result, [[icon, color(` ${color('a')}`)]]);
    });
    it('multiple text', () => {
        Logger.warning(undefined, 'a', 'b');
        deepStrictEqual(result, [[icon, color(`a b`)]]);
    });
   
});
