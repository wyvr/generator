import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { register_stack } from '../../../src/utils/global.js';

describe('utils/global/register_stack', () => {
    afterEach(() => {
        if (global.clearStack) {
            global.clearStack();
        }
        global.setStack = undefined;
    });

    it('getStack of unknown key', () => {
        register_stack();
        let result = getStack('test');
        deepStrictEqual(result, undefined);
    });
    it('getStack of unknown key with fallback', () => {
        register_stack();
        let result = getStack('test', false);
        deepStrictEqual(result, false);
    });
    it('getStack of known key', () => {
        register_stack();
        setStack('test', true);
        let result = getStack('test');
        deepStrictEqual(result, true);
    });
    it('getStack of known key with fallback', () => {
        register_stack();
        setStack('test', true);
        let result = getStack('test', false);
        deepStrictEqual(result, true);
    });
    it('getStack of invalid type', () => {
        register_stack();
        let result = getStack(false);
        deepStrictEqual(result, undefined);
    });
    it('getStack of invalid type', () => {
        register_stack();
        let result = getStack(false);
        deepStrictEqual(result, undefined);
    });
    it('getStack of invalid type with fallback', () => {
        register_stack();
        let result = getStack(false, true);
        deepStrictEqual(result, true);
    });
});
