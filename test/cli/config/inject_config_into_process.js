import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { inject_config_into_process } from '../../../lib/cli/config.js';

describe('cli/config/inject_config_into_process', () => {
    it('undefined', () => {
        const process = undefined;
        inject_config_into_process(process);
        deepStrictEqual(process, undefined);
    });
    it('undefined with config', () => {
        const process = undefined;
        inject_config_into_process(process, {});
        deepStrictEqual(process, undefined);
    });
    it('invalid proces', () => {
        const process = {};
        inject_config_into_process(process, { a: true });
        deepStrictEqual(process, {});
    });
    it('process without config', () => {
        const process = { pid: 1 };
        inject_config_into_process(process, undefined);
        deepStrictEqual(process, { pid: 1 });
    });
    it('process with config', () => {
        const process = { pid: 1 };
        inject_config_into_process(process, { a: true });
        deepStrictEqual(process, { pid: 1, wyvr: { a: true } });
    });
    it('process override config', () => {
        const process = { pid: 1, wyvr: { b: true } };
        inject_config_into_process(process, { a: true });
        deepStrictEqual(process, { pid: 1, wyvr: { a: true } });
    });
});
