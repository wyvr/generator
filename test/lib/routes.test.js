const { removeSync, existsSync } = require('fs-extra');

require('module-alias/register');

describe('Lib/Routes', () => {
    const assert = require('assert');
    const { Routes } = require('@lib/routes');
    const { Route } = require('@lib/model/route');

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
                new Route({
                    path: 'test/lib/routes/js/array/index.js',
                    pkg: null,
                    rel_path: 'routes/js/array/index.js',
                    initial: true,
                    cron: null,
                }),
                new Route({
                    path: 'test/lib/routes/js/error/index.js',
                    pkg: null,
                    rel_path: 'routes/js/error/index.js',
                    initial: true,
                    cron: null,
                }),
                new Route({
                    path: 'test/lib/routes/js/func/index.js',
                    pkg: null,
                    rel_path: 'routes/js/func/index.js',
                    initial: true,
                    cron: null,
                }),
                new Route({
                    path: 'test/lib/routes/js/link/index.js',
                    pkg: null,
                    rel_path: 'routes/js/link/index.js',
                    initial: true,
                    cron: null,
                }),
                new Route({
                    path: 'test/lib/routes/js/null/index.js',
                    pkg: null,
                    rel_path: 'routes/js/null/index.js',
                    initial: true,
                    cron: null,
                }),
                new Route({
                    path: 'test/lib/routes/js/object/index.js',
                    pkg: null,
                    rel_path: 'routes/js/object/index.js',
                    initial: true,
                    cron: null,
                }),
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
                new Route({
                    path: 'test/lib/routes/js/array/index.js',
                    pkg: {
                        name: 'demo',
                        path: '.',
                    },
                    rel_path: 'routes/js/array/index.js',
                    initial: true,
                    cron: null,
                }),
                new Route({
                    path: 'test/lib/routes/js/error/index.js',
                    pkg: null,
                    rel_path: 'routes/js/error/index.js',
                    initial: true,
                    cron: null,
                }),
                new Route({
                    path: 'test/lib/routes/js/func/index.js',
                    pkg: null,
                    rel_path: 'routes/js/func/index.js',
                    initial: true,
                    cron: null,
                }),
                new Route({
                    path: 'test/lib/routes/js/link/index.js',
                    pkg: null,
                    rel_path: 'routes/js/link/index.js',
                    initial: true,
                    cron: null,
                }),
                new Route({
                    path: 'test/lib/routes/js/null/index.js',
                    pkg: null,
                    rel_path: 'routes/js/null/index.js',
                    initial: true,
                    cron: null,
                }),
                new Route({
                    path: 'test/lib/routes/js/object/index.js',
                    pkg: {
                        name: 'demo',
                        path: '.',
                    },
                    rel_path: 'routes/js/object/index.js',
                    initial: true,
                    cron: null,
                }),
            ]);
        });
        it('md', () => {
            const result = Routes.collect_routes('test/lib/routes/md');
            assert.deepStrictEqual(result, [
                new Route({
                    path: 'test/lib/routes/md/attributes/index.md',
                    pkg: null,
                    rel_path: 'routes/md/attributes/index.md',
                    initial: true,
                    cron: null,
                }),
                new Route({
                    path: 'test/lib/routes/md/code/index.md',
                    pkg: null,
                    rel_path: 'routes/md/code/index.md',
                    initial: true,
                    cron: null,
                }),
                new Route({
                    path: 'test/lib/routes/md/empty/index.md',
                    pkg: null,
                    rel_path: 'routes/md/empty/index.md',
                    initial: true,
                    cron: null,
                }),
                new Route({
                    path: 'test/lib/routes/md/file/index.md',
                    pkg: null,
                    rel_path: 'routes/md/file/index.md',
                    initial: true,
                    cron: null,
                }),
            ]);
        });
    });
    describe('execute_route', () => {
        it('undefined', async () => {
            const [error, result] = await Routes.execute_route();
            assert.deepStrictEqual(error, 'broken route undefined');
            assert.deepStrictEqual(result, null);
        });

        it('undefined', async () => {
            const [error, result] = await Routes.execute_route({
                path: 'test/lib/routes/unknown.file',
                pkg: null,
                rel_path: 'routes/unknown.file',
                initial: true,
                cron: null,
            });
            assert.deepStrictEqual(error, null);
            assert.deepStrictEqual(result, null);
        });

        it('markdown', async () => {
            const [error, result] = await Routes.execute_route(
                {
                    path: 'test/lib/routes/md/file/index.md',
                    pkg: null,
                    rel_path: 'routes/md/file/index.md',
                    initial: true,
                    cron: null,
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
                    initial: true,
                    cron: null,
                },
                null
            );
            assert.deepStrictEqual(error, null);
            assert.deepStrictEqual(result, null);
        });
        it('markdown attributes/frontmatter', async () => {
            const [error, result] = await Routes.execute_route(
                {
                    path: 'test/lib/routes/md/attributes/index.md',
                    pkg: null,
                    rel_path: 'routes/md/attributes/index.md',
                    initial: true,
                    cron: null,
                },
                null
            );
            assert.deepStrictEqual(error, null);
            assert.deepStrictEqual(result, [
                {
                    bodyBegin: 5,
                    url: '/md/attributes/',
                    title: 'Attributes Title',
                    demo: true,
                    content: '',
                },
            ]);
        });
        it('markdown escaping code', async () => {
            const [error, result] = await Routes.execute_route(
                {
                    path: 'test/lib/routes/md/code/index.md',
                    pkg: null,
                    rel_path: 'routes/md/code/index.md',
                    initial: true,
                    cron: null,
                },
                null
            );
            assert.deepStrictEqual(error, null);
            assert.deepStrictEqual(result, [
                {
                    bodyBegin: 1,
                    content: '<pre><code class="language-html">&lt;b&gt;&lbrace;test&rbrace;&lt;/b&gt;\n' + '</code></pre>\n',
                    url: '/md/code/',
                },
            ]);
        });
        it('getGlobal', async () => {
            global.getGlobal = null;
            await Routes.execute_route(
                {
                    path: 'test/lib/routes/md/file/index.md',
                    pkg: null,
                    rel_path: 'routes/md/file/index.md',
                    initial: true,
                    cron: null,
                },
                {
                    a: { b: { c: 'found' } },
                }
            );
            assert.strictEqual(await getGlobal('a.b.c'), 'found');
        });
        it('js null', async () => {
            const [error, result] = await Routes.execute_route(
                {
                    path: process.cwd() + '/test/lib/routes/js/null/index.js',
                    pkg: null,
                    rel_path: 'routes/js/null/index.js',
                    initial: true,
                    cron: null,
                },
                null
            );
            assert.deepStrictEqual(error, null);
            assert.deepStrictEqual(result, [null]);
        });
        it('js object', async () => {
            const [error, result] = await Routes.execute_route(
                {
                    path: process.cwd() + '/test/lib/routes/js/object/index.js',
                    pkg: null,
                    rel_path: 'routes/js/object/index.js',
                    initial: true,
                    cron: null,
                },
                null
            );
            assert.deepStrictEqual(error, null);
            assert.deepStrictEqual(result, [{ url: '/js/object' }]);
        });
        it('js array', async () => {
            const [error, result] = await Routes.execute_route(
                {
                    path: process.cwd() + '/test/lib/routes/js/array/index.js',
                    pkg: null,
                    rel_path: 'routes/js/array/index.js',
                    initial: true,
                    cron: null,
                },
                null
            );
            assert.deepStrictEqual(error, null);
            assert.deepStrictEqual(result, [{ url: '/js/array' }]);
        });
        it('js error func', async () => {
            const [error, result] = await Routes.execute_route(
                {
                    path: process.cwd() + '/test/lib/routes/js/error/index.js',
                    pkg: null,
                    rel_path: 'routes/js/error/index.js',
                    initial: true,
                    cron: null,
                },
                null
            );
            assert.deepStrictEqual(error, 'throw error');
            assert.deepStrictEqual(result, null);
        });
        it('js func', async () => {
            const [error, result] = await Routes.execute_route(
                {
                    path: process.cwd() + '/test/lib/routes/js/func/index.js',
                    pkg: null,
                    rel_path: 'routes/js/func/index.js',
                    initial: true,
                    cron: null,
                },
                null
            );
            assert.deepStrictEqual(error, null);
            assert.deepStrictEqual(result, [
                {
                    route: {
                        path: process.cwd() + '/test/lib/routes/js/func/index.js',
                        pkg: null,
                        rel_path: 'routes/js/func/index.js',
                        initial: true,
                        cron: null,
                    },
                    url: '/js/func',
                },
            ]);
        });
    });
    describe('write_routes', () => {
        it('undefined', () => {
            assert.strictEqual(Routes.write_routes(), null);
        });
        it('bool', () => {
            assert.strictEqual(Routes.write_routes(true), null);
        });
        it('string', () => {
            assert.strictEqual(Routes.write_routes('hello'), null);
        });
        it('number', () => {
            assert.strictEqual(Routes.write_routes(10), null);
        });
        it('empty', () => {
            assert.deepStrictEqual(Routes.write_routes([]), []);
        });
        it('routes bool', () => {
            assert.deepStrictEqual(Routes.write_routes([true]), []);
        });
        it('routes string', () => {
            assert.deepStrictEqual(Routes.write_routes(['hello']), []);
        });
        it('routes number', () => {
            assert.deepStrictEqual(Routes.write_routes([10]), []);
        });
        it('valid', () => {
            const result = Routes.write_routes([{ url: '/route-test' }]);
            assert.deepStrictEqual(result, [process.cwd() + '/gen/data/route-test/index.json']);
            result.forEach((file) => {
                assert.strictEqual(existsSync(file), true);
                removeSync(file);
            });
        });
        it('hook', () => {
            let result_route = null;
            const result = Routes.write_routes([{ url: '/route-test-hook' }], (route) => {
                result_route = route;
                return route;
            });
            assert.deepStrictEqual(result_route, { url: '/route-test-hook' });
            result.forEach((file) => {
                assert.strictEqual(existsSync(file), true);
                removeSync(file);
            });
        });
        it('hook without result', () => {
            const result = Routes.write_routes([{ url: '/route-test-hook-empty' }], (route) => {});
            assert.deepStrictEqual(result, []);
        });
    });
});
