import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { collect_i18n } from '../../../src/action/i18n.js';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

describe('action/i18n/collect_i18n', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));

    it('undefined', () => {
        const result = collect_i18n();
        deepStrictEqual(result, {});
    });
    it('empty', () => {
        const result = collect_i18n([]);
        deepStrictEqual(result, {});
    });
    it('invalid packages', () => {
        const result = collect_i18n([{ name: 'test' }]);
        deepStrictEqual(result, {});
    });
    it('simple', () => {
        const result = collect_i18n([{ path: join(__dirname, '_tests/simple') }]);
        deepStrictEqual(result, {
            en: {
                list: {
                    value: 'Value',
                },
            },
        });
    });
    it('override simple + count', () => {
        const result = collect_i18n([
            { path: join(__dirname, '_tests/simple') },
            { path: join(__dirname, '_tests/count') },
        ]);
        deepStrictEqual(result, {
            en: {
                list: {
                    value: 'Count Value',
                    count: {
                        _: '{count} items',
                        0: '{count} items',
                        1: '{count} item',
                        '>10': 'many items',
                        '>100': 'too many items',
                    },
                },
            },
        });
    });
});