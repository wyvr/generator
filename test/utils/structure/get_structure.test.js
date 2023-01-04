import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { get_structure } from '../../../src/utils/structure.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/structure/get_structure', () => {
    const path = join(process.cwd(), 'test', 'utils', 'structure', '_tests');
    const pkg = {
        name: 'Pkg',
        path: '/path/pkg',
    };
    const config = {
        display: 'block',
        render: 'static',
        loading: 'instant',
        media: 'all',
    };

    before(async () => {
        Cwd.set(path);
    });
    beforeEach(() => {});
    afterEach(() => {});
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', async () => {
        deepStrictEqual(get_structure(), undefined);
    });
    it('simple', async () => {
        deepStrictEqual(get_structure('file', { 'src/file': [] }, { 'src/file': config }, { 'src/file': pkg }), {
            file: 'src/file',
            pkg: {
                name: 'Pkg',
                path: '/path/pkg',
            },
            config: {
                display: 'block',
                render: 'static',
                loading: 'instant',
                media: 'all',
            },
            components: [],
        });
    });
    it('not found', async () => {
        deepStrictEqual(get_structure('not_found', { 'src/file': [] }, { 'src/file': config }, { 'src/file': pkg }), {
            file: 'src/not_found',
            pkg: undefined,
            config: undefined,
            components: [],
        });
    });
    it('with dependencies', async () => {
        deepStrictEqual(
            get_structure(
                'file',
                { 'src/file': ['src/child'] },
                {
                    'src/file': config,
                    'src/child': {
                        display: 'inline',
                        render: 'hydrate',
                        loading: 'lazy',
                        media: 'all',
                        portal: 'target',
                    },
                },
                {
                    'src/file': pkg,
                    'src/child': {
                        name: 'Pkg2',
                        path: '/path/pkg2',
                    },
                }
            ),
            {
                file: 'src/file',
                pkg: {
                    name: 'Pkg',
                    path: '/path/pkg',
                },
                config: {
                    display: 'block',
                    render: 'static',
                    loading: 'instant',
                    media: 'all',
                },
                components: [
                    {
                        file: 'src/child',
                        pkg: {
                            name: 'Pkg2',
                            path: '/path/pkg2',
                        },
                        config: {
                            display: 'inline',
                            render: 'hydrate',
                            loading: 'lazy',
                            media: 'all',
                            portal: 'target',
                        },
                        components: [],
                    },
                ],
            }
        );
    });
});
