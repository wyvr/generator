import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Route } from '../../src/model/route.js';
import { EnvType } from '../../src/struc/env.js';

describe('model/route', () => {
    it('default values', () => {
        const route = new Route();
        deepStrictEqual(Object.keys(route), ['cron', 'env', 'initial', 'path', 'pkg', 'rel_path']);
    });
    it('set invalid value', () => {
        const route = new Route('huhu');
        deepStrictEqual(Object.keys(route), ['cron', 'env', 'initial', 'path', 'pkg', 'rel_path']);
    });
    it('set invalid object key', () => {
        const route = new Route({
            huhu: true
        });
        deepStrictEqual(Object.keys(route), ['cron', 'env', 'initial', 'path', 'pkg', 'rel_path']);
    });
    it('set valid object key', () => {
        const route = new Route({
            env: EnvType.dev
        });
        strictEqual(route.env, EnvType.dev);
        deepStrictEqual(Object.keys(route), ['cron', 'env', 'initial', 'path', 'pkg', 'rel_path']);
    });
});
