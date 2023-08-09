import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { WyvrData } from '../../src/model/wyvr_data.js';

describe('model/wyvr_data', () => {
    it('undefined', () => {
        const mtime = new Date().toISOString();

        deepStrictEqual(WyvrData(undefined, undefined, undefined, mtime), {
            change_frequence: 'monthly',
            extension: 'html',
            identifier: 'default',
            identifier_data: {},
            language: 'en',
            mtime,
            collection: [],
            persist: false,
            is_exec: false,
            exec_pattern: undefined,
            priority: 0.5,
            private: false,
            static: false,
            template: {
                doc: ['Default.svelte'],
                layout: ['Default.svelte'],
                page: ['Default.svelte'],
            },
            template_files: {
                doc: undefined,
                layout: undefined,
                page: undefined,
            },
        });
    });
    it('replace properties', () => {
        const mtime = new Date().toISOString();

        deepStrictEqual(
            WyvrData(
                {
                    change_frequence: 'daily',
                    extension: 'json',
                    language: 'de',
                    priority: 0.2,
                    private: true,
                    static: true,
                },
                undefined,
                undefined,
                mtime
            ),
            {
                change_frequence: 'daily',
                extension: 'json',
                identifier: 'default',
                identifier_data: {},
                language: 'de',
                mtime,
                collection: [],
                persist: false,
                is_exec: false,
                exec_pattern: undefined,
                priority: 0.2,
                private: true,
                static: true,
                template: {
                    doc: ['Default.svelte'],
                    layout: ['Default.svelte'],
                    page: ['Default.svelte'],
                },
                template_files: {
                    doc: undefined,
                    layout: undefined,
                    page: undefined,
                },
            }
        );
    });
    it('avoid adding properties', () => {
        const mtime = new Date().toISOString();

        deepStrictEqual(
            WyvrData(
                {
                    test: ['some', 'test'],
                },
                undefined,
                undefined,
                mtime
            ),
            {
                change_frequence: 'monthly',
                extension: 'html',
                identifier: 'default',
                identifier_data: {},
                language: 'en',
                mtime,
                collection: [],
                persist: false,
                is_exec: false,
                exec_pattern: undefined,
                priority: 0.5,
                private: false,
                static: false,
                template: {
                    doc: ['Default.svelte'],
                    layout: ['Default.svelte'],
                    page: ['Default.svelte'],
                },
                template_files: {
                    doc: undefined,
                    layout: undefined,
                    page: undefined,
                },
            }
        );
    });
    it('template as string', () => {
        const result = WyvrData({
            template: 'Page',
        });
        deepStrictEqual(result.template, {
            doc: ['Page.svelte', 'Default.svelte'],
            layout: ['Page.svelte', 'Default.svelte'],
            page: ['Page.svelte', 'Default.svelte'],
        });
    });
    it('template as array', () => {
        const result = WyvrData({
            template: ['CmsPage', 'Page'],
        });
        deepStrictEqual(
            result.template,

            {
                doc: ['CmsPage.svelte', 'Page.svelte', 'Default.svelte'],
                layout: ['CmsPage.svelte', 'Page.svelte', 'Default.svelte'],
                page: ['CmsPage.svelte', 'Page.svelte', 'Default.svelte'],
            }
        );
    });
    it('explicite templates', () => {
        const result = WyvrData({
            template: {
                doc: ['Doc'],
                layout: ['Layout'],
                page: ['Page'],
            },
        });
        deepStrictEqual(result.template, {
            doc: ['Doc.svelte', 'Default.svelte'],
            layout: ['Layout.svelte', 'Default.svelte'],
            page: ['Page.svelte', 'Default.svelte'],
        });
    });
    it('collection preparing', () => {
        const mtime = new Date().toISOString();
        const result = WyvrData(
            {
                collection: [
                    { visible: true, order: 100 },
                    { visible: false, scope: 'test' },
                    undefined,
                    { url: '/url3', name: 'huhu', mtime: 'haha' },
                    {},
                ],
            },
            '/url2',
            'test',
            mtime
        );
        deepStrictEqual(result.collection, [
            {
                name: 'test',
                order: 0,
                scope: 'all',
                url: '/url2',
                visible: true,
                mtime,
            },
            {
                name: 'huhu',
                order: 100,
                scope: 'none',
                url: '/url3',
                visible: true,
                mtime: 'haha',
            },
            {
                name: 'test',
                order: 0,
                scope: 'test',
                url: '/url2',
                visible: false,
                mtime,
            },
        ]);
    });
    it('collection as object', () => {
        const mtime = new Date().toISOString();
        const result = WyvrData(
            {
                collection: { visible: false, scope: 'test', name: 'huhu' },
            },
            '/url2',
            'test',
            mtime
        );
        deepStrictEqual(result.collection, [
            {
                name: 'huhu',
                order: 0,
                scope: 'all',
                url: '/url2',
                mtime,
                visible: false,
            },
            {
                name: 'huhu',
                order: 0,
                scope: 'test',
                url: '/url2',
                mtime,
                visible: false,
            },
        ]);
    });
    it('collection as object doubled called', () => {
        const mtime = new Date().toISOString();
        const result = WyvrData(
            WyvrData(
                {
                    collection: { visible: false, scope: 'test', name: 'huhu' },
                },
                '/url2',
                'test',
                mtime
            ),
            '/url2',
            'test',
            mtime
        );
        deepStrictEqual(result.collection, [
            {
                name: 'huhu',
                order: 0,
                scope: 'all',
                url: '/url2',
                mtime,
                visible: false,
            },
            {
                name: 'huhu',
                order: 0,
                scope: 'test',
                url: '/url2',
                mtime,
                visible: false,
            },
        ]);
    });
});
