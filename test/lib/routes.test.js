require('module-alias/register');

describe('Lib/Routes', () => {
    const assert = require('assert');
    const { Routes } = require('@lib/routes');

    before(() => {});

    describe('collect_routes', () => {
        it('undefined', () => {
            const result = Routes.collect_routes();
            assert.deepStrictEqual(result, []);
        });
        it('empty', () => {
            const result = Routes.collect_routes('test/lib/routes/empty');
            assert.deepStrictEqual(result, []);
        });
        it('js', () => {
            const result = Routes.collect_routes('test/lib/routes/js');
            assert.deepStrictEqual(result, [
                {
                    path: 'test/lib/routes/js/array/index.js',
                    pkg: null,
                    rel_path: 'routes/js/array/index.js',
                },
                {
                    path: 'test/lib/routes/js/link/index.js',
                    pkg: null,
                    rel_path: 'routes/js/link/index.js',
                },
                {
                    path: 'test/lib/routes/js/null/index.js',
                    pkg: null,
                    rel_path: 'routes/js/null/index.js',
                },
                {
                    path: 'test/lib/routes/js/object/index.js',
                    pkg: null,
                    rel_path: 'routes/js/object/index.js',
                },
            ]);
        });
        it('js with package', () => {
            const result = Routes.collect_routes('test/lib/routes/js', {
                'routes/js/array/index.js': {
                    name: 'demo',
                    path: '.',
                },
                'routes/js/object/index.js': {
                    name: 'demo',
                    path: '.',
                },
            });
            assert.deepStrictEqual(result, [
                {
                    path: 'test/lib/routes/js/array/index.js',
                    pkg: {
                        name: 'demo',
                        path: '.',
                    },
                    rel_path: 'routes/js/array/index.js',
                },
                {
                    path: 'test/lib/routes/js/link/index.js',
                    pkg: null,
                    rel_path: 'routes/js/link/index.js',
                },
                {
                    path: 'test/lib/routes/js/null/index.js',
                    pkg: null,
                    rel_path: 'routes/js/null/index.js',
                },
                {
                    path: 'test/lib/routes/js/object/index.js',
                    pkg: {
                        name: 'demo',
                        path: '.',
                    },
                    rel_path: 'routes/js/object/index.js',
                },
            ]);
        });
        it('md', () => {
            const result = Routes.collect_routes('test/lib/routes/md');
            assert.deepStrictEqual(result, [
                {
                    path: 'test/lib/routes/md/empty/index.md',
                    pkg: null,
                    rel_path: 'routes/md/empty/index.md',
                },
                {
                    path: 'test/lib/routes/md/file/index.md',
                    pkg: null,
                    rel_path: 'routes/md/file/index.md',
                },
            ]);
        });
    });
    describe('execute_route', () => {
        it('undefined', async () => {
            const [error, result] = await Routes.execute_route();
            assert.deepStrictEqual(error, 'broken route undefined');
            assert.deepStrictEqual(result, null);
        });
        it('markdown', async () => {
            const [error, result] = await Routes.execute_route(
                {
                    path: 'test/lib/routes/md/file/index.md',
                    pkg: null,
                    rel_path: 'routes/md/file/index.md',
                },
                null
            );
            assert.deepStrictEqual(error, null);
            assert.deepStrictEqual(result, [
                {
                    bodyBegin: 1,
                    content: '<h1 id="some-markdown">Some markdown</h1>\n',
                    url: '/md/file/',
                },
            ]);
        });
        it('markdown empty', async () => {
            const [error, result] = await Routes.execute_route(
                {
                    path: 'test/lib/routes/md/empty/index.md',
                    pkg: null,
                    rel_path: 'routes/md/empty/index.md',
                },
                null
            );
            assert.deepStrictEqual(error, null);
            assert.deepStrictEqual(result, null);
        });
    });
    describe('write_routes', () => {});
});
