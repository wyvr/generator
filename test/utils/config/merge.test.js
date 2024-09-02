import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { Config } from '../../../src/utils/config.js';

describe('utils/config/merge', () => {
    it('undefined', () => {
        deepStrictEqual(Config.merge(), undefined);
    });
    it('undefined params', () => {
        deepStrictEqual(Config.merge(undefined, undefined), undefined);
    });
    it('value', () => {
        deepStrictEqual(Config.merge({}, { key: 'value' }), {
            key: 'value',
        });
    });
    it('first undefined', () => {
        deepStrictEqual(Config.merge(undefined, { key: 'value' }), {
            key: 'value',
        });
    });
    it('second undefined', () => {
        deepStrictEqual(Config.merge({ key: 'value' }, undefined), {
            key: 'value',
        });
    });
    it('array merge', () => {
        deepStrictEqual(
            Config.merge(
                { assets: [{ src: '1' }] },
                { assets: [{ src: '1' }, { src: '2' }] }
            ),
            { assets: [{ src: '1' }, { src: '2' }] }
        );
    });
    it('array merge reversed', () => {
        deepStrictEqual(
            Config.merge(
                { assets: [{ src: '1' }, { src: '2' }] },
                { assets: [{ src: '1' }] }
            ),
            { assets: [{ src: '1' }, { src: '2' }] }
        );
    });
    it('override', () => {
        deepStrictEqual(Config.merge({ key: 'value' }, { key: 'huhu' }), {
            key: 'huhu',
        });
    });
    it('package merging', () => {
        deepStrictEqual(
            Config.merge(
                { packages: [{ name: '1' }, { name: '2' }] },
                { packages: [{ name: '1' }] }
            ),
            { packages: [{ name: '1' }, { name: '2' }] }
        );
    });
    it('avoid cron merging', () => {
        deepStrictEqual(
            Config.merge(
                {
                    cron: {
                        a: { what: ['a1.js'] },
                    },
                },
                {
                    cron: {
                        a: { what: ['a2.js'] },
                        b: { what: ['b.js'] },
                    },
                }
            ),
            {
                cron: {
                    a: { what: ['a2.js'] },
                    b: { what: ['b.js'] },
                },
            }
        );
    });
});
