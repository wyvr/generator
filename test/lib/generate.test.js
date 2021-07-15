require('module-alias/register');

describe('Lib/Generate', () => {
    const assert = require('assert');
    const { Generate } = require('@lib/generate');

    describe('build_nav', () => {
        it('undefined', () => {
            assert.deepStrictEqual(Generate.build_nav(), null);
        });
        it('null', () => {
            assert.deepStrictEqual(Generate.build_nav(null), null);
        });
        it('invalid', () => {
            assert.deepStrictEqual(Generate.build_nav({ a: 'b' }), { a: 'b' });
        });
        it('empty nav', () => {
            assert.deepStrictEqual(Generate.build_nav({ nav: [] }), { nav: [] });
        });
        it('nav without order', () => {
            assert.deepStrictEqual(Generate.build_nav({ nav: [{ url: 'a' }, { url: 'b' }] }), {
                nav: [{ url: 'a' }, { url: 'b' }],
            });
        });
        it('nav with order', () => {
            assert.deepStrictEqual(
                Generate.build_nav({
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
                            { url: 'a', order: 5, parent_id: '', id: 'a' },
                            { url: 'b', order: 0, parent_id: '', id: 'b' },
                            { url: 'c', order: 0, parent_id: '', id: 'c' },
                        ],
                    },
                }
            );
        });
        it('nav with order and all', () => {
            assert.deepStrictEqual(
                Generate.build_nav({
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
                            { url: 'a', order: 5, parent_id: '', id: 'a' },
                            { url: 'b', order: 0, parent_id: '', id: 'b' },
                            { url: 'c', order: 0, parent_id: '', id: 'c' },
                        ],
                        all: [
                            { url: 'c', order: 10, parent_id: '', id: 'c' },
                            { url: 'b', order: 5, parent_id: '', id: 'b' },
                            { url: 'a', order: 0, parent_id: '', id: 'a' },
                        ],
                    },
                }
            );
        });
    });
});
