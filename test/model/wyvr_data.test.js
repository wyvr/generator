import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { WyvrData } from '../../src/model/wyvr_data.js';

describe('model/wyvr_data', () => {
    it('undefined', () => {
        deepStrictEqual(WyvrData(), {
            change_frequence: 'monthly',
            extension: 'html',
            language: 'en',
            nav: [],
            priority: 0.5,
            private: false,
            static: false,
            template: {
                doc: ['Default.svelte'],
                layout: ['Default.svelte'],
                page: ['Default.svelte'],
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
                language: 'de',
                nav: [],
                priority: 0.2,
                private: true,
                static: true,
                template: {
                    doc: ['Default.svelte'],
                    layout: ['Default.svelte'],
                    page: ['Default.svelte'],
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
                language: 'en',
                nav: [],
                priority: 0.5,
                private: false,
                static: false,
                template: {
                    doc: ['Default.svelte'],
                    layout: ['Default.svelte'],
                    page: ['Default.svelte'],
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
                language: 'en',
                nav: [],
                priority: 0.5,
                private: false,
                static: false,
                template: {
                    doc: ['Page.svelte', 'Default.svelte'],
                    layout: ['Page.svelte', 'Default.svelte'],
                    page: ['Page.svelte', 'Default.svelte'],
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
                language: 'en',
                nav: [],
                priority: 0.5,
                private: false,
                static: false,
                template: {
                    doc: ['CmsPage.svelte', 'Page.svelte', 'Default.svelte'],
                    layout: ['CmsPage.svelte', 'Page.svelte', 'Default.svelte'],
                    page: ['CmsPage.svelte', 'Page.svelte', 'Default.svelte'],
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
                language: 'en',
                nav: [],
                priority: 0.5,
                private: false,
                static: false,
                template: {
                    doc: ['Doc.svelte', 'Default.svelte'],
                    layout: ['Layout.svelte', 'Default.svelte'],
                    page: ['Page.svelte', 'Default.svelte'],
                },
            }
        );
    });
    it('nav preparing', () => {
        deepStrictEqual(
            WyvrData({
                nav: [
                    { visible: true, order: 100 },
                    { visible: false, scope: 'test' },
                    undefined,
                    { url: '/url3' },
                    {},
                ],
            }),
            {
                change_frequence: 'monthly',
                extension: 'html',
                language: 'en',
                nav: [],
                priority: 0.5,
                private: false,
                static: false,
                template: {
                    doc: ['Default.svelte'],
                    layout: ['Default.svelte'],
                    page: ['Default.svelte'],
                },
            }
        );
    });
    it('nav preparing with url given', () => {
        deepStrictEqual(
            WyvrData({
                nav: [
                    { visible: true, order: 100 },
                    { visible: false, scope: 'test' },
                    undefined,
                    { url: '/url3' },
                    {},
                ],
            }, '/url'),
            {
                change_frequence: 'monthly',
                extension: 'html',
                language: 'en',
                nav: [
                    { visible: true, url: '/url', order: 100, scope: 'default' },
                    { visible: false, url: '/url', order: 0, scope: 'test' },
                    { visible: true, url: '/url', order: 0, scope: 'default' },
                ],
                priority: 0.5,
                private: false,
                static: false,
                template: {
                    doc: ['Default.svelte'],
                    layout: ['Default.svelte'],
                    page: ['Default.svelte'],
                },
            }
        );
    });
});
