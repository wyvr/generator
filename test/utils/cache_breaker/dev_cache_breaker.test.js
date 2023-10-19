import { strictEqual } from 'assert';
import { describe } from 'mocha';
import { dev_cache_breaker } from '../../../src/utils/cache_breaker.js';
import { Env } from '../../../src/vars/env.js';
import { EnvType } from '../../../src/struc/env.js';

describe('utils/cache_breaker/dev_cache_breaker', () => {
    afterEach(() => {
        Env.value = undefined;
    });
    it('no file in dev', () => {
        Env.set(EnvType.dev)
        const cb = dev_cache_breaker(undefined);
        strictEqual(cb, '');
    });
    it('file in dev', () => {
        Env.set(EnvType.dev)
        const cb = dev_cache_breaker('file');
        strictEqual(cb.substring(0,5), 'file?');
    });
    it('no file in prod', () => {
        Env.set(EnvType.prod)
        const cb = dev_cache_breaker(undefined);
        strictEqual(cb, '');
    });
    it('file in prod', () => {
        Env.set(EnvType.prod)
        const cb = dev_cache_breaker('file');
        strictEqual(cb, 'file');
    });
   
});
