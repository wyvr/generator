import { strictEqual, deepStrictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { EnvType } from '../../../src/struc/env.js';
import { Logger } from '../../../src/utils/logger.js';
import { Env } from '../../../src/vars/env.js';

describe('utils/logger/debug', () => {
    let log, err;
    let result = [];

    const icon = kleur.dim('~');
    const color = kleur.dim;
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
    beforeEach(()=> {
        Env.set(EnvType.debug)
    })
    afterEach(() => {
        result = [];
        Env.set(EnvType.prod)
    });
    after(() => {
        // runs once after the last test in this block
        console.log = log;
        console.error = err;
    });
    it('hide in prod mode', () => {
        Env.set(EnvType.prod)
        Logger.debug('#');
        deepStrictEqual(result, []);
    });

    it('undefined', () => {
        Logger.debug();
        deepStrictEqual(result, [[icon, color('')]]);
    });
    

    it('null', () => {
        Logger.debug(null);
        deepStrictEqual(result, [[icon, color('null')]]);
    });
    it('key', () => {
        Logger.debug('#');
        deepStrictEqual(result, [[icon, color('#')]]);
    });
    it('key + text', () => {
        Logger.debug('#', 'a');
        deepStrictEqual(result, [[icon, color('# a')]]);
    });
    it('key + multiple text', () => {
        Logger.debug('#', 'a', 'b');
        deepStrictEqual(result, [[icon, color('# a b')]]);
    });
    it('text', () => {
        Logger.debug(undefined, 'a');
        deepStrictEqual(result, [[icon, color('a')]]);
    });
    it('multiple text', () => {
        Logger.debug(undefined, 'a', 'b');
        deepStrictEqual(result, [[icon, color('a b')]]);
    });
   
});
