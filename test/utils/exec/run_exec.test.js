import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import Sinon from 'sinon';
import { run_exec } from '../../../src/utils/exec.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { ReleasePath } from '../../../src/vars/release_path.js';

describe('utils/exec/run_exec', () => {
    const dir = join(process.cwd(), 'test', 'utils', 'exec', '_tests');
    let sandbox;
    let log = [];
    before(() => {
        ReleasePath.set(dir);
        sandbox = Sinon.createSandbox();
        sandbox.stub(console, 'error');
        console.error.callsFake((...args) => {
            log.push(args.map(to_plain));
        });
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
        deepStrictEqual(await run_exec(), undefined);
        deepStrictEqual(log, []);
    });
    it('not matching', async () => {
        Cwd.set(join(dir, 'empty'));
        deepStrictEqual(
            await run_exec({ url: '/huhu', method: 'GET' }, {}, '0000', {
                match: '^\\/test$',
                methods: ['get'],
                mtime: 0,
                params: [],
                path: join(dir, 'run/test.js'),
                rel_path: join(dir, 'run/test.js'),
                url: '/test',
            }),
            undefined
        );
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
        const result = await run_exec({ url: '/test/10', method: 'GET' }, {}, '0000', {
            match: '^\\/test/([^\\]]*)$',
            methods: ['get'],
            mtime: 0,
            params: ['id'],
            path: join(dir, 'run/test.js'),
            rel_path: join(dir, 'run/test.js'),
            url: '/test',
        });
        const html = result?.result?.html;
        deepStrictEqual(html, 'dyn content 10');
        deepStrictEqual(log, []);
    });
    it('onExec does not return a object', async () => {
        Cwd.set(join(dir, 'run'));
        const result = await run_exec({ url: '/test/10', method: 'GET' }, {}, '0000', {
            match: '^\\/test/([^\\]]*)$',
            methods: ['get'],
            mtime: 0,
            params: ['id'],
            path: join(dir, 'run/check_on_exec.js'),
            rel_path: join(dir, 'run/check_on_exec.js'),
            url: '/test',
        });
        const html = result?.result?.html;
        deepStrictEqual(html, 'dyn content 10');
        deepStrictEqual(log, [
            [
                '⚠',
                '[exec] onExec in ' +
                    process.cwd() +
                    '/test/utils/exec/_tests/run/check_on_exec.js should return a object',
            ],
        ]);
    });
    it('matching but not exstiting', async () => {
        Cwd.set(join(dir, 'run'));
        const result = await run_exec({ url: '/test/10', method: 'GET' }, {}, '0000', {
            match: '^\\/test/([^\\]]*)$',
            methods: ['get'],
            mtime: 0,
            params: ['id'],
            path: join(dir, 'run/test1.js'),
            rel_path: join(dir, 'run/test1.js'),
            url: '/test',
        });
        deepStrictEqual(result, undefined);
        deepStrictEqual(log, []);
    });
    it('error in onExec and function property', async () => {
        Cwd.set(join(dir, 'run'));
        const result = await run_exec({ url: '/test/10', method: 'GET' }, {}, '0000', {
            match: '^\\/test/([^\\]]*)$',
            methods: ['get'],
            mtime: 0,
            params: ['id'],
            path: join(dir, 'run/errors.js'),
            rel_path: join(dir, 'run/errors.js'),
            url: '/test',
        });
        const html = result?.result?.html;
        deepStrictEqual(html, 'dyn content 10');
        deepStrictEqual(log, [
            ['✖', '[exec] error in onExec function @exec\n[Error] huhu\nsource errors.js'],
            ['✖', '[exec] error in title function @exec\n[Error] hihi\nsource errors.js'],
        ]);
    });
    it('false return instead of object', async () => {
        Cwd.set(join(dir, 'run'));
        const result = await run_exec({ url: '/test/10', method: 'GET' }, {}, '0000', {
            match: '^\\/test/([^\\]]*)$',
            methods: ['get'],
            mtime: 0,
            params: ['id'],
            path: join(dir, 'run/false.js'),
            rel_path: join(dir, 'run/false.js'),
            url: '/test',
        });
        const html = result?.result?.html;
        deepStrictEqual(html, '');
        deepStrictEqual(log, [
            ['⚠', '[exec] onExec in /home/p/wyvr/generator/test/utils/exec/_tests/run/false.js should return a object'],
        ]);
    });
    it('returnJson', async () => {
        Cwd.set(join(dir, 'run'));
        let head, json;
        const result = await run_exec(
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
            {
                'Content-Type': 'application/json',
            },
        ]);
        deepStrictEqual(json, ['{}']);
    });
    it('show all data', async () => {
        Cwd.set(join(dir, 'run'));
        const result = await run_exec({ url: '/test/10?a=b&c', method: 'GET' }, {}, '0000', {
            match: '^\\/test/([^\\]]*)$',
            methods: ['get'],
            mtime: 0,
            params: ['id'],
            path: join(dir, 'run/show_all.js'),
            rel_path: join(dir, 'run/show_all.js'),
            url: '/test',
        });
        const html = result?.result?.html;
        deepStrictEqual(
            html,
            '{"request":{"url":"/test/10?a=b&c","method":"GET"},"response":{},"params":{"id":"10","isExec":true},"query":{"a":"b","c":true},"data":{"url":"/test"}}'
        );
        deepStrictEqual(log, [['⚠', '[exec] returnJSON can only be used in onExec']]);
    });
    it('custom header', async () => {
        Cwd.set(join(dir, 'run'));
        let head, json;
        const result = await run_exec(
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
            {
                'Custom-Head1': 'ch1',
                'Custom-Head2': ['ch2', 'ch3'],
            },
        ]);
    });
});
