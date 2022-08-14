import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
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
                    'test/Parent.svelte': ['test/Middle.svelte', 'test/Nope.svelte', 'test/Second.svelte'],
                    'test/Middle.svelte': ['test/Test.svelte'],
                },
                {
                    'test/Test.svelte': {
                        display: 'block',
                        render: 'hydrate',
                        loading: 'instant',
                        media: 'all',
                    },
                    'test/Middle.svelte': {
                        display: 'block',
                        render: 'static',
                        loading: 'instant',
                        media: 'all',
                    },
                    'test/Parent.svelte': {
                        display: 'block',
                        render: 'static',
                        loading: 'instant',
                        media: 'all',
                    },
                    'test/Second.svelte': {
                        display: 'block',
                        render: 'hydrate',
                        loading: 'instant',
                        media: 'all',
                    },
                },
                'test/Parent.svelte'
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
                    path: 'test/Test.svelte',
                    props: undefined,
                    rel_path: '@src/test/Test.svelte',
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
                    path: 'test/Second.svelte',
                    props: undefined,
                    rel_path: '@src/test/Second.svelte',
                    scripts: undefined,
                    styles: undefined,
                },
            ]
        );
    });
});
