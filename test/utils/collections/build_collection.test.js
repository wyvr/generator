import { deepStrictEqual, strictEqual } from 'assert';
import { describe } from 'mocha';
import { build_collection } from '../../../src/utils/collections.js';

describe('utils/collections/build_collection', () => {
    it('undefined', () => {
        deepStrictEqual(build_collection(), []);
    });
    it('missing data', () => {
        deepStrictEqual(build_collection(undefined, '/url', 'name', { mtime: 'time', src: 'source' }), [
            {
                mtime: {
                    mtime: 'time',
                    src: 'source',
                },
                name: 'name',
                order: 0,
                scope: 'all',
                url: '/url',
                visible: true,
            },
        ]);
    });
    it('data as object', () => {
        const result = build_collection({ visible: false, name: 'huhu' }, '/url', 'name', {
            mtime: 'time',
            src: 'source',
        });
        deepStrictEqual(result, [
            {
                mtime: {
                    mtime: 'time',
                    src: 'source',
                },
                name: 'huhu',
                order: 0,
                scope: 'all',
                url: '/url',
                visible: false,
            },
            {
                mtime: {
                    mtime: 'time',
                    src: 'source',
                },
                name: 'huhu',
                order: 0,
                scope: 'none',
                url: '/url',
                visible: false,
            },
        ]);
    });
    it('data as array', () => {
        const result = build_collection(
            [
                { visible: false, name: 'huhu' },
                { scope: 'nav', name: 'Test' },
            ],
            '/url',
            'name',
            {
                mtime: 'time',
                src: 'source',
            }
        );
        deepStrictEqual(result, [
            {
                mtime: {
                    mtime: 'time',
                    src: 'source',
                },
                name: 'name',
                order: 0,
                scope: 'all',
                url: '/url',
                visible: true,
            },
            {
                mtime: {
                    mtime: 'time',
                    src: 'source',
                },
                name: 'huhu',
                order: 0,
                scope: 'none',
                url: '/url',
                visible: false,
            },
            {
                mtime: {
                    mtime: 'time',
                    src: 'source',
                },
                name: 'Test',
                order: 0,
                scope: 'nav',
                url: '/url',
                visible: true,
            },
        ]);
    });
});
