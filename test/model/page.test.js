import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Page } from '../../src/model/page.js';
import { EnvType } from '../../src/struc/env.js';

describe('model/page', () => {
    it('default values', () => {
        const page = new Page();
        deepStrictEqual(Object.keys(page), ['cron', 'env', 'initial', 'path', 'pkg', 'rel_path']);
    });
    it('set invalid value', () => {
        const page = new Page('huhu');
        deepStrictEqual(Object.keys(page), ['cron', 'env', 'initial', 'path', 'pkg', 'rel_path']);
    });
    it('set invalid object key', () => {
        const page = new Page({
            huhu: true
        });
        deepStrictEqual(Object.keys(page), ['cron', 'env', 'initial', 'path', 'pkg', 'rel_path']);
    });
    it('set valid object key', () => {
        const page = new Page({
            env: EnvType.dev
        });
        strictEqual(page.env, EnvType.dev);
        deepStrictEqual(Object.keys(page), ['cron', 'env', 'initial', 'path', 'pkg', 'rel_path']);
    });
});
