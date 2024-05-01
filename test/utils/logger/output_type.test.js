import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';
import { fakeConsole } from './fakeConsole.js';

describe('utils/logger/output_type', () => {
    const C = fakeConsole();

    beforeEach(() => {
        C.start()
    });
    
    it('undefined', () => {
        Logger.output_type();
        deepStrictEqual(C.end(), [['', '']]);
    });

    it('no value', () => {
        Logger.output_type('log', 'key');
        deepStrictEqual(C.end(), [['key', '']]);
    });

    it('log one value', () => {
        Logger.output_type('log', 'key', 'val1');
        deepStrictEqual(C.end(), [['key', 'val1']]);
    });

    it('log two values', () => {
        Logger.output_type('log', 'key', 'val1', 'val2');
        deepStrictEqual(C.end(), [['key', 'val1 val2']]);
    });

    it('no value inset', () => {
        Logger.inset = 'test';
        Logger.output_type('log', 'key');
        Logger.inset = false;
        deepStrictEqual(C.end(), [['│', 'key', '']]);
    });
});
