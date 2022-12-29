import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import Sinon from 'sinon';
import { extract_exec_config } from '../../../src/utils/exec.js';
import { to_plain } from '../../../src/utils/to.js';
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
        });
    });
});
