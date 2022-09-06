import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import Sinon from 'sinon';
import { run_exec } from '../../../src/utils/exec.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/exec/run_exec', () => {
    const dir = join(process.cwd(), 'test', 'utils', 'exec', '_tests');
    let sandbox;
    let log = [];
    before(() => {
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
});