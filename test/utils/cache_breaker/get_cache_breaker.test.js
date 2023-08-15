import { strictEqual } from 'assert';
import { describe } from 'mocha';
import { get_cache_breaker } from '../../../src/utils/cache_breaker.js';

describe('utils/cache_breaker/get_cache_breaker', () => {
    it('create cache breaker', () => {
        const cb = get_cache_breaker();
        strictEqual(cb[0], '?');
        strictEqual(cb.length, 14);
    });
    it('avoid creating cache breaker', () => {
        const cb = get_cache_breaker(false);
        strictEqual(cb, '');
    });
});
