import { strictEqual } from 'node:assert';
import { describe } from 'mocha';
import { remove_cache_breaker } from '../../../src/utils/cache_breaker.js';

describe('utils/cache_breaker/remove_cache_breaker', () => {
    it('no file', () => {
        const cb = remove_cache_breaker(undefined);
        strictEqual(cb, '');
    });
    it('no cachebreaker', () => {
        const cb = remove_cache_breaker('file');
        strictEqual(cb, 'file');
    });
    it('remove cache breaker', () => {
        const cb = remove_cache_breaker('file?0123');
        strictEqual(cb, 'file');
    });
    it('avoid removing cache breaker', () => {
        const cb = remove_cache_breaker('file?huhu=1');
        strictEqual(cb, 'file?huhu=1');
    });
    it('remove only cache breaker', () => {
        const cb = remove_cache_breaker('file?huhu=1&0123465');
        strictEqual(cb, 'file?huhu=1');
    });
});
