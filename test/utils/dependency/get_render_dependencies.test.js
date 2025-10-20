import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { get_render_dependencies } from '../../../src/utils/dependency.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/dependency/get_render_dependencies', () => {
    const path = join(process.cwd(), 'test', 'utils', 'dependency', '_tests');

    before(async () => {
        Cwd.set(path);
    });
    beforeEach(() => {});
    afterEach(() => {});
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', async () => {
        deepStrictEqual(get_render_dependencies(), []);
    });
    it('get hydrated dependencies', async () => {
        deepStrictEqual(
            get_render_dependencies('src/test/Parent.svelte', {
                'src/test/Test.svelte': {
                    file: 'src/test/Test.svelte',
                    standalone: 'hydrate',
                    config: {
                        display: 'block',
                        render: 'hydrate',
                        loading: 'instant',
                        media: 'all',
                    },
                },
                'src/test/Middle.svelte': {
                    file: 'src/test/Middle.svelte',
                    standalone: 'static',
                    children: ['src/test/Test.svelte'],
                    config: {
                        display: 'block',
                        render: 'static',
                        loading: 'instant',
                        media: 'all',
                    },
                },
                'src/test/Parent.svelte': {
                    file: 'src/test/Parent.svelte',
                    standalone: 'static',
                    children: [
                        'src/test/Middle.svelte',
                        'src/test/Nope.svelte',
                        'src/test/Second.svelte',
                    ],
                    config: {
                        display: 'block',
                        render: 'static',
                        loading: 'instant',
                        media: 'all',
                    },
                },
                'src/test/Second.svelte': {
                    file: 'src/test/Second.svelte',
                    standalone: 'hydrate',
                    config: {
                        display: 'block',
                        render: 'hydrate',
                        loading: 'instant',
                        media: 'all',
                    },
                },
            }),
            [
                {
                    config: {
                        display: 'block',
                        loading: 'instant',
                        media: 'all',
                        render: 'hydrate',
                    },
                    file: 'src/test/Test.svelte',
                    standalone: 'hydrate',
                },
                
                {
                    config: {
                        display: 'block',
                        loading: 'instant',
                        media: 'all',
                        render: 'hydrate',
                    },
                    file: 'src/test/Second.svelte',
                    standalone: 'hydrate',
                },
            ]
        );
    });
    it('get hydrated dependencies without duplicates', async () => {
        deepStrictEqual(
            get_render_dependencies('src/test/Parent.svelte', {
                'src/test/Test.svelte': {
                    file: 'src/test/Test.svelte',
                    standalone: 'hydrate',
                    config: {
                        display: 'block',
                        render: 'hydrate',
                        loading: 'instant',
                        media: 'all',
                    },
                },
                'src/test/Middle.svelte': {
                    file: 'src/test/Middle.svelte',
                    standalone: 'static',
                    children: ['src/test/Test.svelte'],
                    config: {
                        display: 'block',
                        render: 'static',
                        loading: 'instant',
                        media: 'all',
                    },
                },
                'src/test/Parent.svelte': {
                    file: 'src/test/Parent.svelte',
                    standalone: 'static',
                    children: [
                        'src/test/Middle.svelte',
                        'src/test/Nope.svelte',
                        'src/test/Second.svelte',
                        'src/test/Third.svelte',
                    ],
                    config: {
                        display: 'block',
                        render: 'static',
                        loading: 'instant',
                        media: 'all',
                    },
                },
                
                'src/test/Second.svelte': {
                    file: 'src/test/Second.svelte',
                    standalone: 'hydrate',
                    config: {
                        display: 'block',
                        render: 'hydrate',
                        loading: 'instant',
                        media: 'all',
                    },
                },
                'src/test/Third.svelte': {
                    file: 'src/test/Second.svelte',
                    standalone: 'static',
                    children: ['src/test/Test.svelte'],
                    config: {
                        display: 'block',
                        render: 'static',
                        loading: 'instant',
                        media: 'all',
                    },
                },
            }),
            [
                {
                    config: {
                        display: 'block',
                        loading: 'instant',
                        media: 'all',
                        render: 'hydrate',
                    },
                    file: 'src/test/Test.svelte',
                    standalone: 'hydrate',
                },
                
                {
                    config: {
                        display: 'block',
                        loading: 'instant',
                        media: 'all',
                        render: 'hydrate',
                    },
                    file: 'src/test/Second.svelte',
                    standalone: 'hydrate',
                }
            ]
        );
    });
});
