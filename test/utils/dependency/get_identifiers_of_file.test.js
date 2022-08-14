import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
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
            identifiers_of_file: {
                doc: [],
                layout: [],
                page: [],
            },
        });
    });
    it('no identifier found', async () => {
        deepStrictEqual(get_identifiers_of_file({}, 'test/Test.svelte'), {
            files: ['test/Test.svelte'],
            identifiers_of_file: {
                doc: [],
                layout: [],
                page: [],
            },
        });
    });
    it('not used in identifier', async () => {
        deepStrictEqual(
            get_identifiers_of_file(
                {
                    'test/Test.svelte': ['test/Parent.svelte'],
                },
                'test/Test.svelte'
            ),
            {
                files: ['test/Test.svelte', 'test/Parent.svelte'],
                identifiers_of_file: {
                    doc: [],
                    layout: [],
                    page: [],
                },
            }
        );
    });
    it('only doc found', async () => {
        deepStrictEqual(
            get_identifiers_of_file(
                {
                    'test/Test.svelte': ['doc/Doc.svelte'],
                },
                'test/Test.svelte'
            ),
            {
                files: ['test/Test.svelte', 'doc/Doc.svelte'],
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
                    'test/Test.svelte': ['layout/Layout.svelte'],
                },
                'test/Test.svelte'
            ),
            {
                files: ['test/Test.svelte', 'layout/Layout.svelte'],
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
                    'test/Test.svelte': ['page/Page.svelte'],
                },
                'test/Test.svelte'
            ),
            {
                files: ['test/Test.svelte', 'page/Page.svelte'],
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
                    'test/Test.svelte': ['test/Deep.svelte'],
                    'test/Deep.svelte': ['doc/Doc.svelte', 'layout/Layout.svelte', 'page/Page.svelte'],
                },
                'test/Test.svelte'
            ),
            {
                files: ['test/Test.svelte', 'test/Deep.svelte', 'doc/Doc.svelte', 'layout/Layout.svelte', 'page/Page.svelte'],
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
