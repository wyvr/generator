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
            get_exec('/huhu', 'GET', {
                '^\\/huhu$': {
                    url: '/huhu',
                    path: './huhu.js',
                    rel_path: 'huhu.js',
                    params: [],
                    match: '^\\/huhu$',
                    mtime: 0.0,
                    methods: ['get']
                },
            }),
            {
                url: '/huhu',
                path: './huhu.js',
                rel_path: 'huhu.js',
                params: [],
                match: '^\\/huhu$',
                mtime: 0.0,
                methods: ['get']
            }
            );
    });
    it('unmatching exec', () => {
        deepStrictEqual(
            get_exec('/huhu1', 'GET', {
                '^\\/huhu$': {
                    url: '/huhu',
                    path: './huhu.js',
                    rel_path: 'huhu.js',
                    params: [],
                    match: '^\\/huhu$',
                    mtime: 0.0,
                    methods: ['get']
                },
            }),
            undefined
        );
    });
    it('unmatching method', () => {
        deepStrictEqual(
            get_exec('/huhu', 'PATCH', {
                '^\\/huhu$': {
                    url: '/huhu',
                    path: './huhu.js',
                    rel_path: 'huhu.js',
                    params: [],
                    match: '^\\/huhu$',
                    mtime: 0.0,
                    methods: ['get']
                },
            }),
            undefined
        );
    });
});
