import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { get_exec } from '../../../src/utils/exec.js';

describe('utils/exec/get_exec', () => {
    it('undefined', () => {
        deepStrictEqual(get_exec(), undefined);
    });
    it('undefined exec_cache', () => {
        deepStrictEqual(get_exec('/huhu', 'get'), undefined);
    });
    it('invalid method', () => {
        deepStrictEqual(
            get_exec('/huhu', 1, [
                {
                    url: '/huhu',
                    path: './huhu.js',
                    rel_path: 'huhu.js',
                    params: [],
                    match: '^\\/huhu$',
                    mtime: 0.0,
                    methods: ['get'],
                },
            ]),
            undefined
        );
    });
    it('matching exec', () => {
        deepStrictEqual(
            get_exec('/huhu', 'GET', [
                {
                    url: '/huhu',
                    path: './huhu.js',
                    rel_path: 'huhu.js',
                    params: [],
                    match: '^\\/huhu$',
                    mtime: 0.0,
                    methods: ['get'],
                },
            ]),
            {
                url: '/huhu',
                path: './huhu.js',
                rel_path: 'huhu.js',
                params: [],
                match: '^\\/huhu$',
                mtime: 0.0,
                methods: ['get'],
            }
        );
    });
    it('wrong formatted method', () => {
        deepStrictEqual(
            get_exec('/huhu', ' PoST    ', [
                {
                    url: '/huhu',
                    path: './huhu.js',
                    rel_path: 'huhu.js',
                    params: [],
                    match: '^\\/huhu$',
                    mtime: 0.0,
                    methods: ['post'],
                },
            ]),
            {
                match: '^\\/huhu$',
                methods: ['post'],
                mtime: 0,
                params: [],
                path: './huhu.js',
                rel_path: 'huhu.js',
                url: '/huhu',
            }
        );
    });
    it('unmatching exec', () => {
        deepStrictEqual(
            get_exec('/huhu1', 'GET', [
                {
                    url: '/huhu',
                    path: './huhu.js',
                    rel_path: 'huhu.js',
                    params: [],
                    match: '^\\/huhu$',
                    mtime: 0.0,
                    methods: ['get'],
                },
            ]),
            undefined
        );
    });
    it('unmatching method', () => {
        deepStrictEqual(
            get_exec('/huhu', 'PATCH', [
                {
                    url: '/huhu',
                    path: './huhu.js',
                    rel_path: 'huhu.js',
                    params: [],
                    match: '^\\/huhu$',
                    mtime: 0.0,
                    methods: ['get'],
                },
            ]),
            undefined
        );
    });
});
