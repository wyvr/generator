import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { WyvrData } from '../../src/model/wyvr_data.js';

describe('model/wyvr_data', () => {
    it('undefined', () => {
        deepStrictEqual(WyvrData(), {
            change_frequence: 'monthly',
            extension: 'html',
            identifier: 'default',
            language: 'en',
            collection: [],
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
        deepStrictEqual(
            WyvrData({
                change_frequence: 'daily',
                extension: 'json',
                language: 'de',
                priority: 0.2,
                private: true,
                static: true,
            }),
            {
                change_frequence: 'daily',
                extension: 'json',
                identifier: 'default',
                language: 'de',
                collection: [],
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
        deepStrictEqual(
            WyvrData({
                test: ['some', 'test'],
            }),
            {
                change_frequence: 'monthly',
                extension: 'html',
                identifier: 'default',
                language: 'en',
                collection: [],
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
        deepStrictEqual(
            WyvrData({
                template: 'Page',
            }),
            {
                change_frequence: 'monthly',
                extension: 'html',
                identifier: 'default',
                language: 'en',
                collection: [],
                priority: 0.5,
                private: false,
                static: false,
                template: {
                    doc: ['Page.svelte', 'Default.svelte'],
                    layout: ['Page.svelte', 'Default.svelte'],
                    page: ['Page.svelte', 'Default.svelte'],
                },
                template_files: {
                    doc: undefined,
                    layout: undefined,
                    page: undefined,
                },
            }
        );
    });
    it('template as array', () => {
        deepStrictEqual(
            WyvrData({
                template: ['CmsPage', 'Page'],
            }),
            {
                change_frequence: 'monthly',
                extension: 'html',
                identifier: 'default',
                language: 'en',
                collection: [],
                priority: 0.5,
                private: false,
                static: false,
                template: {
                    doc: ['CmsPage.svelte', 'Page.svelte', 'Default.svelte'],
                    layout: ['CmsPage.svelte', 'Page.svelte', 'Default.svelte'],
                    page: ['CmsPage.svelte', 'Page.svelte', 'Default.svelte'],
                },
                template_files: {
                    doc: undefined,
                    layout: undefined,
                    page: undefined,
                },
            }
        );
    });
    it('explicite templates', () => {
        deepStrictEqual(
            WyvrData({
                template: {
                    doc: ['Doc'],
                    layout: ['Layout'],
                    page: ['Page'],
                },
            }),
            {
                change_frequence: 'monthly',
                extension: 'html',
                identifier: 'default',
                language: 'en',
                collection: [],
                priority: 0.5,
                private: false,
                static: false,
                template: {
                    doc: ['Doc.svelte', 'Default.svelte'],
                    layout: ['Layout.svelte', 'Default.svelte'],
                    page: ['Page.svelte', 'Default.svelte'],
                },
                template_files: {
                    doc: undefined,
                    layout: undefined,
                    page: undefined,
                },
            }
        );
    });
    it('collection preparing', () => {
        deepStrictEqual(
            WyvrData(
                {
                    collection: [
                        { visible: true, order: 100 },
                        { visible: false, scope: 'test' },
                        undefined,
                        { url: '/url3', name: 'huhu' },
                        {},
                    ],
                },
                '/url2',
                'test'
            ),
            {
                change_frequence: 'monthly',
                extension: 'html',
                identifier: 'default',
                language: 'en',
                collection: [
                    {
                        name: 'test',
                        order: 0,
                        scope: 'all',
                        url: '/url2',
                        visible: true,
                    },
                    {
                        name: 'huhu',
                        order: 100,
                        scope: 'none',
                        url: '/url3',
                        visible: true,
                    },
                    {
                        name: 'test',
                        order: 0,
                        scope: 'test',
                        url: '/url2',
                        visible: false,
                    },
                ],
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
    it('collection as object', () => {
        deepStrictEqual(
            WyvrData(
                {
                    collection: { visible: false, scope: 'test', name: 'huhu' },
                },
                '/url2',
                'test'
            ),
            {
                change_frequence: 'monthly',
                extension: 'html',
                identifier: 'default',
                language: 'en',
                collection: [
                    {
                        name: 'huhu',
                        order: 0,
                        scope: 'all',
                        url: '/url2',
                        visible: false,
                    },
                    {
                        name: 'huhu',
                        order: 0,
                        scope: 'test',
                        url: '/url2',
                        visible: false,
                    },
                ],
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
});
