import { strictEqual, deepStrictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/info', () => {
    let log, err;
    let result = [];

    const icon = kleur.blue('ℹ');
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
        Logger.info();
        deepStrictEqual(result, [[icon, '']]);
    });
    

    it('null', () => {
        Logger.info(null);
        deepStrictEqual(result, [[icon, '']]);
    });
    it('key', () => {
        Logger.info('#');
        deepStrictEqual(result, [[icon, '#']]);
    });
    it('key + text', () => {
        Logger.info('#', 'a');
        deepStrictEqual(result, [[icon, `# ${color('a')}`]]);
    });
    it('key + multiple text', () => {
        Logger.info('#', 'a', 'b');
        deepStrictEqual(result, [[icon, `# ${color('a')} b`]]);
    });
    it('text', () => {
        Logger.info(undefined, 'a');
        deepStrictEqual(result, [[icon, ` ${color('a')}`]]);
    });
    it('multiple text', () => {
        Logger.info(undefined, 'a', 'b');
        deepStrictEqual(result, [[icon, ` ${color('a')} b`]]);
    });
   
});
