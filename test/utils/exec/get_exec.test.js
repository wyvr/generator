import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { get_exec } from '../../../src/utils/exec.js';

describe('utils/exec/get_exec', () => {
    it('undefined', () => {
        deepStrictEqual(get_exec(), undefined);
    });
    it('undefined exec_cache', () => {
        deepStrictEqual(get_exec('/huhu'), undefined);
    });
    it('matching exec', () => {
        deepStrictEqual(
            get_exec('/huhu', {
                '^\\/huhu$': {
                    url: '/huhu',
                    path: './huhu.js',
                    rel_path: 'huhu.js',
                    params: [],
                    match: '^\\/huhu$',
                    mtime: 0.0,
                },
            }),
            {
                url: '/huhu',
                path: './huhu.js',
                rel_path: 'huhu.js',
                params: [],
                match: '^\\/huhu$',
                mtime: 0.0,
            }
        );
    });
    it('unmatching exec', () => {
        deepStrictEqual(
            get_exec('/huhu1', {
                '^\\/huhu$': {
                    url: '/huhu',
                    path: './huhu.js',
                    rel_path: 'huhu.js',
                    params: [],
                    match: '^\\/huhu$',
                    mtime: 0.0,
                },
            }),
            undefined
        );
    });
});
