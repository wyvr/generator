import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { get_route, extract_route_config } from '../../../src/utils/routes.js';
import { join } from 'node:path';

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
                    match: '^\\/huhu\\/?$',
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
                    match: '^\\/huhu\\/?$',
                    mtime: 0.0,
                    methods: ['get'],
                },
            ]),
            {
                url: '/huhu',
                path: './huhu.js',
                rel_path: 'huhu.js',
                params: [],
                match: '^\\/huhu\\/?$',
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
                    match: '^\\/huhu\\/?$',
                    mtime: 0.0,
                    methods: ['post'],
                },
            ]),
            {
                match: '^\\/huhu\\/?$',
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
                    match: '^\\/huhu\\/?$',
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
                    match: '^\\/huhu\\/?$',
                    mtime: 0.0,
                    methods: ['get'],
                },
            ]),
            undefined
        );
    });
    it('get exact match of similar routes', async () => {
        const dir = join(process.cwd(), 'test', 'utils', 'routes', '_tests');
        const cache = [
            await extract_route_config({ url: '/hu/hi/[slug]' }, join(dir, 'config/test.js')),
            await extract_route_config({ url: '/hu/hi' }, join(dir, 'config/test.js')),
        ];
        const route = get_route('/hu/hi/', 'GET', cache);
        deepStrictEqual(!!route, true);
        deepStrictEqual(route.url, '/hu/hi');
    });
    it('get exact match of similar routes for parameterized url', async () => {
        const dir = join(process.cwd(), 'test', 'utils', 'routes', '_tests');
        const cache = [
            await extract_route_config({ url: '/hu/hi/[slug]' }, join(dir, 'config/test.js')),
            await extract_route_config({ url: '/hu/hi' }, join(dir, 'config/test.js')),
        ];
        const route = get_route('/hu/hi/test', 'GET', cache);
        deepStrictEqual(!!route, true);
        deepStrictEqual(route.url, '/hu/hi/[slug]');
    });
    it('match when index.html is appended', () => {
        const route = get_route('/huhu/index.html', 'GET', [
            {
                url: '/huhu',
                path: './huhu.js',
                rel_path: 'huhu.js',
                params: [],
                match: '^\\/huhu\\/?$',
                mtime: 0.0,
                methods: ['get'],
            },
        ]);
        deepStrictEqual(!!route, true);
        deepStrictEqual(route.url, '/huhu');
    });
    it('match when index.htm is appended', () => {
        const route = get_route('/huhu/index.htm', 'GET', [
            {
                url: '/huhu',
                path: './huhu.js',
                rel_path: 'huhu.js',
                params: [],
                match: '^\\/huhu\\/?$',
                mtime: 0.0,
                methods: ['get'],
            },
        ]);
        deepStrictEqual(!!route, true);
        deepStrictEqual(route.url, '/huhu');
    });
});
