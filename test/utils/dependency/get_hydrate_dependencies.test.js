import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { get_hydrate_dependencies } from '../../../src/utils/dependency.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/dependency/get_hydrate_dependencies', () => {
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
        deepStrictEqual(get_hydrate_dependencies(), []);
    });
    it('get hydrated dependencies', async () => {
        deepStrictEqual(
            get_hydrate_dependencies(
                {
                    'src/test/Parent.svelte': ['src/test/Middle.svelte', 'src/test/Nope.svelte', 'src/test/Second.svelte'],
                    'src/test/Middle.svelte': ['src/test/Test.svelte'],
                },
                {
                    'src/test/Test.svelte': {
                        display: 'block',
                        render: 'hydrate',
                        loading: 'instant',
                        media: 'all',
                    },
                    'src/test/Middle.svelte': {
                        display: 'block',
                        render: 'static',
                        loading: 'instant',
                        media: 'all',
                    },
                    'src/test/Parent.svelte': {
                        display: 'block',
                        render: 'static',
                        loading: 'instant',
                        media: 'all',
                    },
                    'src/test/Second.svelte': {
                        display: 'block',
                        render: 'hydrate',
                        loading: 'instant',
                        media: 'all',
                    },
                },
                'src/test/Parent.svelte'
            ),
            [
                {
                    config: {
                        display: 'block',
                        loading: 'instant',
                        media: 'all',
                        render: 'hydrate',
                    },
                    from_lazy: undefined,
                    name: 'test_Test',
                    path: 'src/test/Test.svelte',
                    props: undefined,
                    rel_path: '$src/test/Test.svelte',
                    scripts: undefined,
                    styles: undefined,
                },

                {
                    config: {
                        display: 'block',
                        loading: 'instant',
                        media: 'all',
                        render: 'hydrate',
                    },
                    from_lazy: undefined,
                    name: 'test_Second',
                    path: 'src/test/Second.svelte',
                    props: undefined,
                    rel_path: '$src/test/Second.svelte',
                    scripts: undefined,
                    styles: undefined,
                },
            ]
        );
    });
});
