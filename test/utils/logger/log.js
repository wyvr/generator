import { strictEqual, deepStrictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/log', () => {
    let log, err;
    let result = [];

    const icon = '';
    const color = (value) => value;
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
        Logger.log();
        deepStrictEqual(result, [[icon, '']]);
    });
    

    it('null', () => {
        Logger.log(null);
        deepStrictEqual(result, [[icon, 'null']]);
    });
    it('key', () => {
        Logger.log('#');
        deepStrictEqual(result, [[icon, '#']]);
    });
    it('key + text', () => {
        Logger.log('#', 'a');
        deepStrictEqual(result, [[icon, `# ${color('a')}`]]);
    });
    it('key + multiple text', () => {
        Logger.log('#', 'a', 'b');
        deepStrictEqual(result, [[icon, `# ${color('a')} b`]]);
    });
    it('text', () => {
        Logger.log(undefined, 'a');
        deepStrictEqual(result, [[icon, `${color('a')}`]]);
    });
    it('multiple text', () => {
        Logger.log(undefined, 'a', 'b');
        deepStrictEqual(result, [[icon, `${color('a')} b`]]);
    });
   
});
