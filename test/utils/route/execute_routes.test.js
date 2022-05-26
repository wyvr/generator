import { deepStrictEqual } from 'assert';
import { join } from 'path';
import { Cwd } from '../../../src/vars/cwd.js';
import { Route } from '../../../src/model/route.js';
import { execute_route } from '../../../src/utils/route.js';
import Sinon from 'sinon';

describe('utils/route/execute_route', () => {
    let log = [];
    const root = join(process.cwd(), 'test/utils/route/_tests/execute_route');
    
    before(() => {
        Cwd.set(root);
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            log.push(msg);
        });
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        console.error.restore();
        Cwd.set(undefined);
    });
        it('undefined', async () => {
            deepStrictEqual(await execute_route(), undefined);
            deepStrictEqual(log, []);
        });

        // it('undefined', async () => {
        //     const [error, result] = await execute_route({
        //         path: 'test/lib/routes/unknown.file',
        //         pkg: null,
        //         rel_path: 'routes/unknown.file',
        //         initial: true,
        //         cron: null,
        //     });
        //     deepStrictEqual(error, null);
        //     deepStrictEqual(result, null);
        // });

        // it('markdown', async () => {
        //     const [error, result] = await execute_route(
        //         {
        //             path: 'test/lib/routes/md/file/index.md',
        //             pkg: null,
        //             rel_path: 'routes/md/file/index.md',
        //             initial: true,
        //             cron: null,
        //         },
        //         null
        //     );
        //     deepStrictEqual(error, null);
        //     deepStrictEqual(result, [
        //         {
        //             bodyBegin: 1,
        //             content: '<h1 id="some-markdown">Some markdown</h1>\n',
        //             url: '/md/file/',
        //         },
        //     ]);
        // });
        // it('markdown empty', async () => {
        //     const [error, result] = await execute_route(
        //         {
        //             path: 'test/lib/routes/md/empty/index.md',
        //             pkg: null,
        //             rel_path: 'routes/md/empty/index.md',
        //             initial: true,
        //             cron: null,
        //         },
        //         null
        //     );
        //     deepStrictEqual(error, null);
        //     deepStrictEqual(result, null);
        // });
        // it('markdown attributes/frontmatter', async () => {
        //     const [error, result] = await execute_route(
        //         {
        //             path: 'test/lib/routes/md/attributes/index.md',
        //             pkg: null,
        //             rel_path: 'routes/md/attributes/index.md',
        //             initial: true,
        //             cron: null,
        //         },
        //         null
        //     );
        //     deepStrictEqual(error, null);
        //     deepStrictEqual(result, [
        //         {
        //             bodyBegin: 5,
        //             url: '/md/attributes/',
        //             title: 'Attributes Title',
        //             demo: true,
        //             content: '',
        //         },
        //     ]);
        // });
        // it('markdown escaping code', async () => {
        //     const [error, result] = await execute_route(
        //         {
        //             path: 'test/lib/routes/md/code/index.md',
        //             pkg: null,
        //             rel_path: 'routes/md/code/index.md',
        //             initial: true,
        //             cron: null,
        //         },
        //         null
        //     );
        //     deepStrictEqual(error, null);
        //     deepStrictEqual(result, [
        //         {
        //             bodyBegin: 1,
        //             content: '<pre><code class="language-html">&lt;b&gt;&lbrace;test&rbrace;&lt;/b&gt;\n' + '</code></pre>\n',
        //             url: '/md/code/',
        //         },
        //     ]);
        // });
        // // it('getGlobal', async () => {
        // //     global.getGlobal = null;
        // //     await execute_route(
        // //         {
        // //             path: 'test/lib/routes/md/file/index.md',
        // //             pkg: null,
        // //             rel_path: 'routes/md/file/index.md',
        // //             initial: true,
        // //             cron: null,
        // //         },
        // //         {
        // //             a: { b: { c: 'found' } },
        // //         }
        // //     );
        // //     strictEqual(await getGlobal('a.b.c'), 'found');
        // // });
        // it('js null', async () => {
        //     const [error, result] = await execute_route(
        //         {
        //             path: process.cwd() + '/test/lib/routes/js/null/index.js',
        //             pkg: null,
        //             rel_path: 'routes/js/null/index.js',
        //             initial: true,
        //             cron: null,
        //         },
        //         null
        //     );
        //     deepStrictEqual(error, null);
        //     deepStrictEqual(result, [null]);
        // });
        // it('js object', async () => {
        //     const [error, result] = await execute_route(
        //         {
        //             path: process.cwd() + '/test/lib/routes/js/object/index.js',
        //             pkg: null,
        //             rel_path: 'routes/js/object/index.js',
        //             initial: true,
        //             cron: null,
        //         },
        //         null
        //     );
        //     deepStrictEqual(error, null);
        //     deepStrictEqual(result, [{ url: '/js/object' }]);
        // });
        // it('js array', async () => {
        //     const [error, result] = await execute_route(
        //         {
        //             path: process.cwd() + '/test/lib/routes/js/array/index.js',
        //             pkg: null,
        //             rel_path: 'routes/js/array/index.js',
        //             initial: true,
        //             cron: null,
        //         },
        //         null
        //     );
        //     deepStrictEqual(error, null);
        //     deepStrictEqual(result, [{ url: '/js/array' }]);
        // });
        // it('js error func', async () => {
        //     const [error, result] = await execute_route(
        //         {
        //             path: process.cwd() + '/test/lib/routes/js/error/index.js',
        //             pkg: null,
        //             rel_path: 'routes/js/error/index.js',
        //             initial: true,
        //             cron: null,
        //         },
        //         null
        //     );
        //     deepStrictEqual(error, 'throw error');
        //     deepStrictEqual(result, null);
        // });
        // it('js func', async () => {
        //     const [error, result] = await execute_route(
        //         {
        //             path: process.cwd() + '/test/lib/routes/js/func/index.js',
        //             pkg: null,
        //             rel_path: 'routes/js/func/index.js',
        //             initial: true,
        //             cron: null,
        //         },
        //         null
        //     );
        //     deepStrictEqual(error, null);
        //     deepStrictEqual(result, [
        //         {
        //             route: {
        //                 path: process.cwd() + '/test/lib/routes/js/func/index.js',
        //                 pkg: null,
        //                 rel_path: 'routes/js/func/index.js',
        //                 initial: true,
        //                 cron: null,
        //             },
        //             url: '/js/func',
        //         },
        //     ]);
        // });
    });