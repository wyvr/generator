import { strictEqual } from 'assert';
import { describe } from 'mocha';
import { append_cache_breaker } from '../../../src/utils/cache_breaker.mjs';

describe('utils/cache_breaker/append_cache_breaker', () => {
    it('no file to append', () => {
        const cb = append_cache_breaker(undefined);
        strictEqual(cb, '');
    });
    it('no file to append and avoid appending', () => {
        const cb = append_cache_breaker(undefined, false);
        strictEqual(cb, '');
    });
    it('append cache breaker', () => {
        const cb = append_cache_breaker('file');
        strictEqual(cb[4], '?');
        strictEqual(cb.length, 18);
    });
    it('avoid appending cache breaker', () => {
        const cb = append_cache_breaker('file', false);
        strictEqual(cb, 'file');
    });
});
