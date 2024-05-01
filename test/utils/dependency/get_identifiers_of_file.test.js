import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { get_identifiers_of_file } from '../../../src/utils/dependency.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/dependency/get_identifiers_of_file', () => {
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
        deepStrictEqual(get_identifiers_of_file(), {
            files: [],
            identifiers_of_file: [],
        });
    });
    it('no identifier found', async () => {
        deepStrictEqual(get_identifiers_of_file({}, 'src/test/Test.svelte'), {
            files: ['src/test/Test.svelte'],
            identifiers_of_file: [],
        });
    });
    it('not used in identifier', async () => {
        deepStrictEqual(
            get_identifiers_of_file(
                {
                    'src/test/Test.svelte': ['src/test/Parent.svelte'],
                },
                'src/test/Test.svelte'
            ),
            {
                files: ['src/test/Test.svelte', 'src/test/Parent.svelte'],
                identifiers_of_file: [],
            }
        );
    });
    it('modify parent', async () => {
        deepStrictEqual(
            get_identifiers_of_file(
                {
                    'src/test/Test.svelte': ['src/layout/Layout.svelte'],
                },
                'src/layout/Layout.svelte'
            ),
            {
                files: ['src/layout/Layout.svelte'],
                identifiers_of_file: [
                    {
                        doc: 'Default.js',
                        identifier: 'default-layout-default',
                        layout: 'Layout.svelte',
                        page: 'Default.js',
                    },
                ],
            }
        );
    });
    it('only doc found', async () => {
        deepStrictEqual(
            get_identifiers_of_file(
                {
                    'src/test/Test.svelte': ['src/doc/Doc.svelte'],
                },
                'src/test/Test.svelte'
            ),
            {
                files: ['src/test/Test.svelte', 'src/doc/Doc.svelte'],
                identifiers_of_file: [
                    {
                        doc: 'Doc.svelte',
                        identifier: 'doc-default-default',
                        layout: 'Default.js',
                        page: 'Default.js',
                    },
                ],
            }
        );
    });
    it('only layout found', async () => {
        deepStrictEqual(
            get_identifiers_of_file(
                {
                    'src/test/Test.svelte': ['src/layout/Layout.svelte'],
                },
                'src/test/Test.svelte'
            ),
            {
                files: ['src/test/Test.svelte', 'src/layout/Layout.svelte'],
                identifiers_of_file: [
                    {
                        doc: 'Default.js',
                        identifier: 'default-layout-default',
                        layout: 'Layout.svelte',
                        page: 'Default.js',
                    },
                ],
            }
        );
    });
    it('only page found', async () => {
        deepStrictEqual(
            get_identifiers_of_file(
                {
                    'src/test/Test.svelte': ['src/page/Page.svelte'],
                },
                'src/test/Test.svelte'
            ),
            {
                files: ['src/test/Test.svelte', 'src/page/Page.svelte'],
                identifiers_of_file: [
                    {
                        doc: 'Default.js',
                        identifier: 'default-default-page',
                        layout: 'Default.js',
                        page: 'Page.svelte',
                    },
                ],
            }
        );
    });
    it('identifier found', async () => {
        deepStrictEqual(
            get_identifiers_of_file(
                {
                    'src/test/Test.svelte': ['src/test/Deep.svelte'],
                    'src/test/Deep.svelte': ['src/doc/Doc.svelte', 'src/layout/Layout.svelte', 'src/page/Page.svelte'],
                },
                'src/test/Test.svelte'
            ),
            {
                files: [
                    'src/test/Test.svelte',
                    'src/test/Deep.svelte',
                    'src/doc/Doc.svelte',
                    'src/layout/Layout.svelte',
                    'src/page/Page.svelte',
                ],
                identifiers_of_file: [
                    {
                        doc: 'Doc.svelte',
                        identifier: 'doc-layout-page',
                        layout: 'Layout.svelte',
                        page: 'Page.svelte',
                    },
                ],
            }
        );
    });
});
