import { deepStrictEqual } from 'node:assert';
import { join } from 'node:path';
import { Cwd } from '../../../src/vars/cwd.js';
import { execute_page } from '../../../src/utils/pages.js';
import Sinon from 'sinon';
import { mockPage } from './mockPage.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';

describe('utils/pages/execute_page', () => {
    let log = [];
    const root = join(process.cwd(), 'test/utils/pages/_tests/execute_page');
    const __root = join(to_dirname(import.meta.url), '..', '..', '..');

    before(() => {
        Cwd.set(root);
        Sinon.stub(console, 'log');
        console.log.callsFake((...msg) => {
            log.push(msg.map(to_plain));
        });
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        console.log.restore();
        Cwd.set(undefined);
    });
    it('undefined', async () => {
        deepStrictEqual(await execute_page(), undefined);
        deepStrictEqual(log, [['⚠', 'invalid page was given']]);
    });
    it('markdown file', async () => {
        deepStrictEqual(
            await execute_page(mockPage('pages/markdown.md', undefined, root)),
            [
                {
                    content:
                        '<h1 id="lorem-ipsum-dolor-sit-amet">Lorem ipsum dolor sit amet</h1>\n' +
                        '<p>Nam ut porta metus, rhoncus rutrum est.</p>\n',
                    title: 'Title',
                    param: true,
                    url: '/markdown',
                },
            ]
        );
        deepStrictEqual(log, []);
    });
    it('markdown file empty', async () => {
        deepStrictEqual(
            await execute_page(
                mockPage('pages/markdown_empty.md', undefined, root)
            ),
            undefined
        );
        deepStrictEqual(log, []);
    });
    it('js file, object', async () => {
        deepStrictEqual(
            await execute_page(mockPage('pages/static.js', undefined, root)),
            [
                {
                    url: '/url',
                },
            ]
        );
        deepStrictEqual(log, []);
    });
    it('js file, array', async () => {
        deepStrictEqual(
            await execute_page(mockPage('pages/array.js', undefined, root)),
            [
                {
                    url: '/url',
                },
            ]
        );
        deepStrictEqual(log, []);
    });
    it('js function file, object', async () => {
        deepStrictEqual(
            await execute_page(mockPage('pages/func.js', undefined, root)),
            [
                {
                    url: '/url',
                },
            ]
        );
        deepStrictEqual(log, []);
    });
    it('js function file, array', async () => {
        deepStrictEqual(
            await execute_page(
                mockPage('pages/func_array.js', undefined, root)
            ),
            [
                {
                    url: '/url',
                },
            ]
        );
        deepStrictEqual(log, []);
    });
    it('js file, empty', async () => {
        deepStrictEqual(
            await execute_page(mockPage('pages/empty.js', undefined, root)),
            undefined
        );
        deepStrictEqual(log, []);
    });
    it('js file, undefined', async () => {
        deepStrictEqual(
            await execute_page(mockPage('pages/undefined.js', undefined, root)),
            undefined
        );
        deepStrictEqual(log, []);
    });
    it('js file, error', async () => {
        deepStrictEqual(
            await execute_page(mockPage('pages/error.js', undefined, root)),
            undefined
        );
        deepStrictEqual(log, [
            [
                '✖',
                '@page execution\n' +
                    '[ReferenceError] undefined_var is not defined\n' +
                    'source pages/error.js',
            ],
        ]);
    });
    it('js file, error common js', async () => {
        deepStrictEqual(
            await execute_page(mockPage('pages/commonjs.js', undefined, root)),
            undefined
        );
        deepStrictEqual(log, [
            [
                '✖',
                `@page execution\n[ReferenceError] exports is not defined in ES module scope\nThis file is being treated as an ES module because it has a '.js' file extension and '${__root}/package.json\' contains "type": "module". To treat it as a CommonJS script, rename it to use the \'.cjs\' file extension.\nsource pages/commonjs.js`,
            ],
        ]);
    });
    it('unknonwn extension', async () => {
        deepStrictEqual(
            await execute_page(mockPage('pages/unknown.py', undefined, root)),
            undefined
        );
        deepStrictEqual(log, [
            ['⚠', 'unknown file extension .py for page pages/unknown.py'],
        ]);
    });
});
