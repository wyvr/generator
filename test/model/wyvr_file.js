import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { WyvrFile } from '../../src/model/wyvr_file.js';
import { WyvrFileConfig } from '../../src/struc/wyvr_file.js';

describe('model/wyvr_file', () => {
    it('undefined', () => {
        deepStrictEqual(WyvrFile(), {
            name: '',
            path: undefined,
            config: WyvrFileConfig,
            scripts: undefined,
            styles: undefined,
            props: undefined,
            rel_path: '',
            from_lazy: undefined,
        });
    });
    it('path', () => {
        deepStrictEqual(WyvrFile('gen/test/file'), {
            name: 'file',
            path: 'gen/test/file',
            config: WyvrFileConfig,
            scripts: undefined,
            styles: undefined,
            props: undefined,
            rel_path: '@src/file',
            from_lazy: undefined,
        });
    });
    it('deep path', () => {
        deepStrictEqual(WyvrFile('gen/src/component/file'), {
            name: 'component_file',
            path: 'gen/src/component/file',
            config: WyvrFileConfig,
            scripts: undefined,
            styles: undefined,
            props: undefined,
            rel_path: '@src/component/file',
            from_lazy: undefined,
        });
    });
    it('reserved word', () => {
        deepStrictEqual(WyvrFile('gen/src/byte'), {
            name: '_byte',
            path: 'gen/src/byte',
            config: WyvrFileConfig,
            scripts: undefined,
            styles: undefined,
            props: undefined,
            rel_path: '@src/byte',
            from_lazy: undefined,
        });
    });
});
