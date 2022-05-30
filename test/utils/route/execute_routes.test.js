import { deepStrictEqual } from 'assert';
import { join } from 'path';
import { Cwd } from '../../../src/vars/cwd.js';
import { execute_route } from '../../../src/utils/route.js';
import Sinon from 'sinon';
import { mockRoute } from './mockRoute.js';
import { to_plain } from '../../../src/utils/to.js';

describe('utils/route/execute_route', () => {
    let log = [];
    const root = join(process.cwd(), 'test/utils/route/_tests/execute_route');

    before(() => {
        Cwd.set(root);
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            log.push(msg.map(to_plain));
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
        deepStrictEqual(log, [['⚠', 'invalid route was given']]);
    });
    it('markdown file', async () => {
        deepStrictEqual(await execute_route(mockRoute('routes/markdown.md', undefined, root)), [
            {
                content:
                    '<h1 id="lorem-ipsum-dolor-sit-amet">Lorem ipsum dolor sit amet</h1>\n' +
                    '<p>Nam ut porta metus, rhoncus rutrum est.</p>\n',
                title: 'Title',
                param: true,
                url: '/markdown',
            },
        ]);
        deepStrictEqual(log, []);
    });
    it('markdown file empty', async () => {
        deepStrictEqual(await execute_route(mockRoute('routes/markdown_empty.md', undefined, root)), undefined);
        deepStrictEqual(log, []);
    });
    it('js file, object', async () => {
        deepStrictEqual(await execute_route(mockRoute('routes/static.js', undefined, root)), [
            {
                url: '/url',
            },
        ]);
        deepStrictEqual(log, []);
    });
    it('js file, array', async () => {
        deepStrictEqual(await execute_route(mockRoute('routes/array.js', undefined, root)), [
            {
                url: '/url',
            },
        ]);
        deepStrictEqual(log, []);
    });
    it('js function file, object', async () => {
        deepStrictEqual(await execute_route(mockRoute('routes/func.js', undefined, root)), [
            {
                url: '/url',
            },
        ]);
        deepStrictEqual(log, []);
    });
    it('js function file, array', async () => {
        deepStrictEqual(await execute_route(mockRoute('routes/func_array.js', undefined, root)), [
            {
                url: '/url',
            },
        ]);
        deepStrictEqual(log, []);
    });
    it('js file, empty', async () => {
        deepStrictEqual(await execute_route(mockRoute('routes/empty.js', undefined, root)), undefined);
        deepStrictEqual(log, []);
    });
    it('js file, undefined', async () => {
        deepStrictEqual(await execute_route(mockRoute('routes/undefined.js', undefined, root)), undefined);
        deepStrictEqual(log, []);
    });
    it('js file, error', async () => {
        deepStrictEqual(await execute_route(mockRoute('routes/error.js', undefined, root)), undefined);
        deepStrictEqual(log, [
            [
                '✖',
                '@route execution\n' +
                    '[ReferenceError] undefined_var is not defined\n' +
                    'stack\n' +
                    'source routes/error.js',
            ],
        ]);
    });
    it('js file, error common js', async () => {
        deepStrictEqual(await execute_route(mockRoute('routes/commonjs.js', undefined, root)), undefined);
        deepStrictEqual(log, [
            [
                '✖',
                '@route execution\n' +
                    '[ReferenceError] exports is not defined in ES module scope\n' +
                    'stack\n' +
                    'source routes/commonjs.js',
            ],
        ]);
    });
    it('unknonwn extension', async () => {
        deepStrictEqual(await execute_route(mockRoute('routes/unknown.py', undefined, root)), undefined);
        deepStrictEqual(log, [['⚠', 'unknown file extension .py for route routes/unknown.py']]);
    });
});
