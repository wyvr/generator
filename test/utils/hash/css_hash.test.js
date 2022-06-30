import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { css_hash } from '../../../src/utils/hash.js';

describe('utils/hash/css_hash', () => {
    it('undefined', () => {
        const result = css_hash();
        strictEqual(result, 'wyvr');
    });
    it('has values', () => {
        const result = css_hash({ hash: () => '#', css: true, name: true, filename: true });
        strictEqual(result, 'wyvr-#');
    });
});
