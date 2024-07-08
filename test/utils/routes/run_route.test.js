import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import Sinon from 'sinon';
import { modify_svelte_internal } from '../../../src/action/modify_svelte.mjs';
import { FOLDER_GEN_SERVER } from '../../../src/constants/folder.js';
import { run_route } from '../../../src/utils/routes.js';
import { exists, find_file, read, write } from '../../../src/utils/file.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { ReleasePath } from '../../../src/vars/release_path.js';
import { SerializableResponse } from '../../../src/model/serializable/response.js';

describe('utils/routes/run_route', () => {
    const __root = join(to_dirname(import.meta.url), '..', '..', '..');
    const dir = join(process.cwd(), 'test', 'utils', 'routes', '_tests');
    let sandbox;
    let log = [];

    before(async () => {
        ReleasePath.set(dir);
        sandbox = Sinon.createSandbox();
        sandbox.stub(console, 'log');
        console.log.callsFake((...args) => {
            log.push(args.map(to_plain));
        });
        const internal_file = find_file('.', [
            'node_modules/svelte/internal/index.mjs',
        ]);
        const internal_path = join(
            dir,
            'run',
            FOLDER_GEN_SERVER,
            'svelte_internal.mjs'
        );
        if (!exists(internal_path)) {
            write(
                internal_path,
                await modify_svelte_internal(read(internal_file))
            );
        }
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        Cwd.set(undefined);
        ReleasePath.set(undefined);
        sandbox.restore();
    });
    it('undefined', async () => {
        Cwd.set(join(dir, 'empty'));
        deepStrictEqual(await run_route(), [
            undefined,
            new SerializableResponse(),
        ]);
        deepStrictEqual(log, []);
    });
    it('not matching', async () => {
        Cwd.set(join(dir, 'empty'));
        const [result] = await run_route(
            { url: '/huhu', method: 'GET' },
            {},
            '0000',
            {
                match: '^\\/test$',
                methods: ['get'],
                mtime: 0,
                params: [],
                path: join(dir, 'run/test.js'),
                rel_path: join(dir, 'run/test.js'),
                url: '/test',
            }
        );
        deepStrictEqual(result, undefined);
        deepStrictEqual(log, [
            [
                '✖',
                `0000 can't extract params from url /huhu {"match":"^\\\\/test$","methods":["get"],"mtime":0,"params":[],"path":"${join(
                    dir,
                    'run/test.js'
                )}","rel_path":"${join(dir, 'run/test.js')}","url":"/test"}`,
            ],
        ]);
    });
    it('matching', async () => {
        Cwd.set(join(dir, 'run'));
        const [result] = await run_route(
            { url: '/test/10', method: 'GET' },
            {},
            '0000',
            {
                match: '^\\/test/([^\\]]*)$',
                methods: ['get'],
                mtime: 0,
                params: ['id'],
                path: join(dir, 'run/test.js'),
                rel_path: join(dir, 'run/test.js'),
                url: '/test',
            }
        );
        const html = result?.result?.html;
        deepStrictEqual(html, 'dyn content 10');
        deepStrictEqual(log, []);
    });
    it('onExec does not return a object', async () => {
        Cwd.set(join(dir, 'run'));
        const [result] = await run_route(
            { url: '/test/10', method: 'GET' },
            {},
            '0000',
            {
                match: '^\\/test/([^\\]]*)$',
                methods: ['get'],
                mtime: 0,
                params: ['id'],
                path: join(dir, 'run/check_on_route.js'),
                rel_path: join(dir, 'run/check_on_route.js'),
                url: '/test',
            }
        );
        const html = result?.result?.html;
        deepStrictEqual(html, 'dyn content 10');
        deepStrictEqual(log, [
            [
                '⚠',
                `[route] onExec in ${process.cwd()}/test/utils/routes/_tests/run/check_on_route.js should return a object`,
            ],
        ]);
    });
    it('matching but not exstiting', async () => {
        Cwd.set(join(dir, 'run'));
        const [result] = await run_route(
            { url: '/test/10', method: 'GET' },
            {},
            '0000',
            {
                match: '^\\/test/([^\\]]*)$',
                methods: ['get'],
                mtime: 0,
                params: ['id'],
                path: join(dir, 'run/test1.js'),
                rel_path: join(dir, 'run/test1.js'),
                url: '/test',
            }
        );
        deepStrictEqual(result, undefined);
        deepStrictEqual(log, []);
    });
    it('error in onExec and function property', async () => {
        Cwd.set(join(dir, 'run'));
        const [result] = await run_route(
            { url: '/test/10', method: 'GET' },
            {},
            '0000',
            {
                match: '^\\/test/([^\\]]*)$',
                methods: ['get'],
                mtime: 0,
                params: ['id'],
                path: join(dir, 'run/errors.js'),
                rel_path: join(dir, 'run/errors.js'),
                url: '/test',
            }
        );
        const html = result?.result?.html;
        deepStrictEqual(html, 'dyn content 10');
        deepStrictEqual(log, [
            [
                '✖',
                '[route] error in onExec function @route\n[Error] huhu\nsource errors.js',
            ],
            [
                '✖',
                '[route] error in title function @route\n[Error] hihi\nsource errors.js',
            ],
        ]);
    });
    it('false return instead of object', async () => {
        Cwd.set(join(dir, 'run'));
        const [result] = await run_route(
            { url: '/test/10', method: 'GET' },
            {},
            '0000',
            {
                match: '^\\/test/([^\\]]*)$',
                methods: ['get'],
                mtime: 0,
                params: ['id'],
                path: join(dir, 'run/false.js'),
                rel_path: join(dir, 'run/false.js'),
                url: '/test',
            }
        );
        const html = result?.result?.html;
        deepStrictEqual(html, '');
        deepStrictEqual(log, [
            [
                '⚠',
                `[route] onExec in ${__root}/test/utils/routes/_tests/run/false.js should return a object`,
            ],
        ]);
    });
    it('returnJson', async () => {
        Cwd.set(join(dir, 'run'));
        let head;
        let json;
        const [result] = await run_route(
            { url: '/test/10', method: 'GET' },
            {
                writeHead: (...args) => {
                    head = args;
                },
                end: (...args) => {
                    json = args;
                },
                writableEnded: true,
            },
            '0000',
            {
                match: '^\\/test/([^\\]]*)$',
                methods: ['get'],
                mtime: 0,
                params: ['id'],
                path: join(dir, 'run/return_json.js'),
                rel_path: join(dir, 'run/return_json.js'),
                url: '/test',
            }
        );
        deepStrictEqual(result, undefined);
        deepStrictEqual(head, [
            404,
            undefined,
            {
                'Content-Type': 'application/json',
            },
        ]);
        deepStrictEqual(json, ['{}']);
    });
    it('show all data', async () => {
        Cwd.set(join(dir, 'run'));
        const [result] = await run_route(
            { url: '/test/10?a=b&c', method: 'GET' },
            {},
            '0000',
            {
                match: '^\\/test/([^\\]]*)$',
                methods: ['get'],
                mtime: 0,
                params: ['id'],
                path: join(dir, 'run/show_all.js'),
                rel_path: join(dir, 'run/show_all.js'),
                url: '/test',
            }
        );
        const html = result?.result?.html;
        deepStrictEqual(
            html,
            '{"request":{"url":"/test/10?a=b&c","method":"GET"},"response":{"uid":"0000"},"params":{"id":"10","isExec":true},"headers":{"visitor_languages":[]},"cookies":{},"query":{"a":"b","c":true},"body":{},"files":{},"data":{"$route":{"match":"^\\\\/test/([^\\\\]]*)$","methods":["get"],"mtime":0,"params":["id"],"path":"/home/p/wyvr/generator/test/utils/routes/_tests/run/show_all.js","rel_path":"/home/p/wyvr/generator/test/utils/routes/_tests/run/show_all.js","url":"/test"},"url":"/test"},"isProd":true}'
        );
        deepStrictEqual(log, [
            ['⚠', '[route] returnJSON can only be used in onExec'],
        ]);
    });

    it('JSON in query parameters', async () => {
        Cwd.set(join(dir, 'run'));
        const [result] = await run_route(
            {
                url: '/test/10?conditions=%5B%7B%22attribute%22%3A%22sale%22%2C%22operator%22%3A%22%3D%3D%22%2C%22value%22%3A%221%22%7D%5D&amount=10',
                method: 'GET',
            },
            {},
            '0000',
            {
                match: '^\\/test/([^\\]]*)$',
                methods: ['get'],
                mtime: 0,
                params: ['id'],
                path: join(dir, 'run/show_all.js'),
                rel_path: join(dir, 'run/show_all.js'),
                url: '/test',
            }
        );
        const html = result?.result?.html;
        deepStrictEqual(
            html,
            '{"request":{"url":"/test/10?conditions=%5B%7B%22attribute%22%3A%22sale%22%2C%22operator%22%3A%22%3D%3D%22%2C%22value%22%3A%221%22%7D%5D&amount=10","method":"GET"},"response":{"uid":"0000"},"params":{"id":"10","isExec":true},"headers":{"visitor_languages":[]},"cookies":{},"query":{"conditions":"[{\\"attribute\\":\\"sale\\",\\"operator\\":\\"==\\",\\"value\\":\\"1\\"}]","amount":"10"},"body":{},"files":{},"data":{"$route":{"match":"^\\\\/test/([^\\\\]]*)$","methods":["get"],"mtime":0,"params":["id"],"path":"/home/p/wyvr/generator/test/utils/routes/_tests/run/show_all.js","rel_path":"/home/p/wyvr/generator/test/utils/routes/_tests/run/show_all.js","url":"/test"},"url":"/test"},"isProd":true}'
        );
        deepStrictEqual(log, [
            ['⚠', '[route] returnJSON can only be used in onExec'],
        ]);
    });
    it('custom header', async () => {
        Cwd.set(join(dir, 'run'));
        let head;
        const [result] = await run_route(
            { url: '/test/10', method: 'GET' },
            {
                writeHead: (...args) => {
                    head = args;
                },
            },
            '0000',
            {
                match: '^\\/test/([^\\]]*)$',
                methods: ['get'],
                mtime: 0,
                params: ['id'],
                path: join(dir, 'run/custom_head.js'),
                rel_path: join(dir, 'run/custom_head.js'),
                url: '/test',
            }
        );
        const html = result?.result?.html;
        deepStrictEqual(html, '');
        deepStrictEqual(head, [
            201,
            undefined,
            {
                'Custom-Head1': 'ch1',
                'Custom-Head2': ['ch2', 'ch3'],
            },
        ]);
    });
});
