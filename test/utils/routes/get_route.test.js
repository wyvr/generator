import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { get_route } from '../../../src/utils/routes.js';

describe('utils/routes/get_route', () => {
    it('undefined', () => {
        deepStrictEqual(get_route(), undefined);
    });
    it('undefined route_cache', () => {
        deepStrictEqual(get_route('/huhu', 'get'), undefined);
    });
    it('invalid method', () => {
        deepStrictEqual(
            get_route('/huhu', 1, [
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
    it('matching route', () => {
        deepStrictEqual(
            get_route('/huhu', 'GET', [
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
            get_route('/huhu', ' PoST    ', [
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
    it('unmatching route', () => {
        deepStrictEqual(
            get_route('/huhu1', 'GET', [
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
            get_route('/huhu', 'PATCH', [
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
