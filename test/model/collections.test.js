import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { collection_entry } from '../../src/model/collection.js';

describe('model/collections/collection_entry', () => {
    it('default values', () => {
        const entry = collection_entry();
        deepStrictEqual(entry, {
            name: undefined,
            order: 0,
            scope: 'none',
            visible: true,
            url: '',
            mtime: undefined,
        });
    });
    it('override all values', () => {
        const entry = collection_entry({
            name: 'Custom',
            order: 2,
            scope: 'custom',
            visible: false,
            url: '/url',
            mtime: {
                mtime: 'sampledate',
                src: 'samplesrc',
            },
        });
        deepStrictEqual(entry, {
            name: 'Custom',
            order: 2,
            scope: 'custom',
            visible: false,
            url: '/url',
            mtime: {
                mtime: 'sampledate',
                src: 'samplesrc',
            },
        });
    });
    it('fill only some values', () => {
        const entry = collection_entry({
            name: 'Custom',
            scope: 'custom',
            visible: false,
            url: '/url',
        });
        deepStrictEqual(entry, {
            name: 'Custom',
            order: 0,
            scope: 'custom',
            visible: false,
            url: '/url',
            mtime: undefined,
        });
    });
    it('avoid setting unknown properties', () => {
        const entry = collection_entry({
            name: 'Custom',
            scope: 'custom',
            visible: false,
            url: '/url',
            unknown: true,
        });
        deepStrictEqual(entry, {
            name: 'Custom',
            order: 0,
            scope: 'custom',
            visible: false,
            url: '/url',
            mtime: undefined,
        });
    });
    it('default values, with fallback values', () => {
        const entry = collection_entry(undefined, { name: 'huhu' });
        deepStrictEqual(entry, {
            name: 'huhu',
            order: 0,
            scope: 'none',
            visible: true,
            url: '',
            mtime: undefined,
        });
    });
    it('ignore fallback values', () => {
        const entry = collection_entry(
            {
                name: 'Custom',
                order: 2,
                scope: 'custom',
                visible: false,
                url: '/url',
                mtime: {
                    mtime: 'sampledate',
                    src: 'samplesrc',
                },
            },
            { name: 'huhu' }
        );
        deepStrictEqual(entry, {
            name: 'Custom',
            order: 2,
            scope: 'custom',
            visible: false,
            url: '/url',
            mtime: {
                mtime: 'sampledate',
                src: 'samplesrc',
            },
        });
    });
    it('fill only some values from data and from fallback', () => {
        const entry = collection_entry(
            {
                name: 'Custom',
                scope: 'custom',
                visible: false,
                url: '/url',
            },
            { name: 'huhu', order: 1 }
        );
        deepStrictEqual(entry, {
            name: 'Custom',
            order: 1,
            scope: 'custom',
            visible: false,
            url: '/url',
            mtime: undefined,
        });
    });
});
