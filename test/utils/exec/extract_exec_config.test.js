import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { extract_exec_config } from '../../../src/utils/exec.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/exec/extract_exec_config', () => {
    const dir = join(process.cwd(), 'test', 'utils', 'exec', '_tests');
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', async () => {
        Cwd.set(join(dir, 'config'));
        deepStrictEqual(await extract_exec_config(), undefined);
    });
    it('non existing', async () => {
        Cwd.set(join(dir, 'config'));
        deepStrictEqual(await extract_exec_config({ url: '/test' }, join(dir, 'config/non-existing.js')), undefined);
    });
    it('exists', async () => {
        Cwd.set(join(dir, 'config'));
        const result = await extract_exec_config({ url: '/test' }, join(dir, 'config/test.js'));
        result.mtime = 0;
        deepStrictEqual(result, {
            match: '^\\/test/?$',
            methods: ['get', 'head', 'post', 'put', 'delete', 'connect', 'options', 'trace', 'patch'],
            mtime: 0,
            params: [],
            path: join(dir, 'config/test.js'),
            rel_path: join(dir, 'config/test.js'),
            url: '/test',
            weight: 1015,
        });
    });
    it('methods', async () => {
        Cwd.set(join(dir, 'config'));
        const result = await extract_exec_config(
            {
                url: '/methods',
                _wyvr: {
                    exec_methods: ['post', 'invalid'],
                },
            },
            join(dir, 'config/methods.js')
        );
        result.mtime = 0;
        deepStrictEqual(result, {
            match: '^\\/methods/?$',
            methods: ['post'],
            mtime: 0,
            params: [],
            path: join(dir, 'config/methods.js'),
            rel_path: join(dir, 'config/methods.js'),
            url: '/methods',
            weight: 1018,
        });
    });
    it('all methods', async () => {
        Cwd.set(join(dir, 'config'));
        const result = await extract_exec_config(
            {
                url: '/methods',
                _wyvr: {
                    exec_methods: 'all',
                },
            },
            join(dir, 'config/methods.js')
        );
        result.mtime = 0;
        deepStrictEqual(result.methods, [
            'get',
            'head',
            'post',
            'put',
            'delete',
            'connect',
            'options',
            'trace',
            'patch',
        ]);
    });
    it('weight test', async () => {
        Cwd.set(join(dir, 'config'));
        const result = await extract_exec_config(
            {
                url: '/exact/[param]/.*',
            },
            join(dir, 'config/weight.js')
        );
        result.mtime = 0;
        deepStrictEqual(result.weight, 1137);
        deepStrictEqual(result.params, ['param']);
        deepStrictEqual(result.path, join(dir, 'config/weight.js'));
    });
    it('async _wyvr prop', async () => {
        Cwd.set(join(dir, 'config'));
        const result = await extract_exec_config(
            {
                url: '/exact/[param]/.*',
                _wyvr: async () => {
                    return new Promise((resolve, reject) => {
                        setTimeout(() => {
                            resolve({
                                exec_methods: ['get'],
                            });
                        }, 5);
                    });
                },
            },
            join(dir, 'config/weight.js')
        );
        result.mtime = 0;
        deepStrictEqual(result.methods, ['get']);
        deepStrictEqual(result.weight, 1137);
        deepStrictEqual(result.params, ['param']);
        deepStrictEqual(result.path, join(dir, 'config/weight.js'));
    });
});
