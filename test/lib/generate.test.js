require('module-alias/register');

describe('Lib/Generate', () => {
    const assert = require('assert');
    const { Generate } = require('@lib/generate');

    describe('sort_nav', () => {
        it('undefined', () => {
            assert.deepStrictEqual(Generate.sort_nav(), null);
        });
        it('null', () => {
            assert.deepStrictEqual(Generate.sort_nav(null), null);
        });
        it('invalid', () => {
            assert.deepStrictEqual(Generate.sort_nav({ a: 'b' }), { a: 'b' });
        });
        it('empty nav', () => {
            assert.deepStrictEqual(Generate.sort_nav({ nav: [] }), { nav: [] });
        });
        it('nav without order', () => {
            assert.deepStrictEqual(Generate.sort_nav({ nav: [{ url: 'a' }, { url: 'b' }] }), { nav: [{ url: 'a' }, { url: 'b' }] });
        });
        it('nav with order', () => {
            assert.deepStrictEqual(
                Generate.sort_nav({
                    nav: {
                        test: [
                            { url: 'b', order: 0 },
                            { url: 'c', order: 0 },
                            { url: 'a', order: 5 },
                        ],
                    },
                }),
                {
                    nav: {
                        test: [
                            { url: 'a', order: 5 },
                            { url: 'b', order: 0 },
                            { url: 'c', order: 0 },
                        ],
                    },
                }
            );
        });
        it('nav with order and all', () => {
            assert.deepStrictEqual(
                Generate.sort_nav({
                    nav: {
                        test: [
                            { url: 'b', order: 0 },
                            { url: 'c', order: 0 },
                            { url: 'a', order: 5 },
                        ],
                        all: [
                            { url: 'b', order: 5 },
                            { url: 'a', order: 0 },
                            { url: 'c', order: 10 },
                        ],
                    },
                }),
                {
                    nav: {
                        test: [
                            { url: 'a', order: 5 },
                            { url: 'b', order: 0 },
                            { url: 'c', order: 0 },
                        ],
                        all: [
                            { url: 'c', order: 10 },
                            { url: 'b', order: 5 },
                            { url: 'a', order: 0 },
                        ],
                    },
                }
            );
        });
    });
});
