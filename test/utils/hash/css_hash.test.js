import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { css_hash } from '../../../src/utils/hash.js';

describe('action/i18n/write_language', () => {
    it('undefined', () => {
        const result = css_hash();
        strictEqual(result, 'wyvr');
    });
    it('has values', () => {
        const result = css_hash({ hash: () => '#', css: true, name: true, filename: true });
        strictEqual(result, 'wyvr-#');
    });
});
