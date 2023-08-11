import { deepStrictEqual, strictEqual } from 'assert';
import { describe } from 'mocha';
import { append_entry_to_collections } from '../../../src/utils/collections.js';

describe('utils/collections/append_entry_to_collections', () => {
    it('undefined', () => {
        deepStrictEqual(append_entry_to_collections(undefined), {});
    });
    it('nothing to append', () => {
        const collections = {};
        append_entry_to_collections(collections);
        deepStrictEqual(collections, {});
    });
    it('append entry to empty collection', () => {
        const collections = {};
        append_entry_to_collections(collections, { name: 'huhu', visible: false, scope: 'nav', url: '/url' });
        deepStrictEqual(collections, { nav: [{ name: 'huhu', visible: false, url: '/url' }] });
    });
    it('append invalid entry to empty collection', () => {
        const collections = {};
        append_entry_to_collections(collections, { name: 'huhu', visible: false, scope: 'nav' });
        deepStrictEqual(collections, {});
    });
    it('append entry to filled collection', () => {
        const collections = { nav: [{ name: 'test', url: '/test' }] };
        append_entry_to_collections(collections, { name: 'huhu', visible: false, scope: 'nav', url: '/url' });
        deepStrictEqual(collections, {
            nav: [
                { name: 'test', url: '/test' },
                { name: 'huhu', visible: false, url: '/url' },
            ],
        });
    });
    it('append invalid entry to filled collection', () => {
        const collections = { nav: [{ name: 'test', url: '/test' }] };
        append_entry_to_collections(collections, { name: 'huhu', visible: false, scope: 'nav' });
        deepStrictEqual(collections, { nav: [{ name: 'test', url: '/test' }] });
    });
});
