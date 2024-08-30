import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { get_identifiers_of_list } from '../../../src/utils/dependency.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/dependency/get_identifiers_of_list', () => {
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
        deepStrictEqual(get_identifiers_of_list(), []);
    });
    it('empty', async () => {
        deepStrictEqual(get_identifiers_of_list([]), []);
    });
    it('no identifier found', async () => {
        deepStrictEqual(
            get_identifiers_of_list({
                file: 'src/test/Test.svelte',
                children: [],
                root: null,
            }),
            []
        );
    });
    it('not used in identifier', async () => {
        deepStrictEqual(
            get_identifiers_of_list([
                { file: 'src/test/Test.svelte', root: null },
                { file: 'src/test/Parent.svelte', root: null },
            ]),
            [
                {
                    doc: 'Default.js',
                    identifier: 'default',
                    layout: 'Default.js',
                    page: 'Default.js',
                },
            ]
        );
    });
    it('modify parent', async () => {
        deepStrictEqual(
            get_identifiers_of_list([
                { file: 'src/test/Test.svelte', root: null },
                { file: 'src/layout/Layout.svelte', root: 'layout' },
            ]),
            [
                {
                    doc: 'Default.js',
                    identifier: 'default-layout-default',
                    layout: 'Layout.svelte',
                    page: 'Default.js',
                },
            ]
        );
    });
    it('only doc found', async () => {
        deepStrictEqual(
            get_identifiers_of_list([
                { file: 'src/doc/Doc.svelte', root: 'doc' },
                { file: 'src/test/Test.svelte', root: null },
            ]),
            [
                {
                    doc: 'Doc.svelte',
                    identifier: 'doc-default-default',
                    layout: 'Default.js',
                    page: 'Default.js',
                },
            ]
        );
    });
    it('only layout found', async () => {
        deepStrictEqual(
            get_identifiers_of_list([
                { file: 'src/layout/Layout.svelte', root: 'layout' },
                { file: 'src/test/Test.svelte', root: null },
            ]),
            [
                {
                    doc: 'Default.js',
                    identifier: 'default-layout-default',
                    layout: 'Layout.svelte',
                    page: 'Default.js',
                },
            ]
        );
    });
    it('only page found', async () => {
        deepStrictEqual(
            get_identifiers_of_list([
                { file: 'src/page/Page.svelte', root: 'page' },
                { file: 'src/test/Test.svelte', root: null },
            ]),
            [
                {
                    doc: 'Default.js',
                    identifier: 'default-default-page',
                    layout: 'Default.js',
                    page: 'Page.svelte',
                },
            ]
        );
    });
    it('identifier found', async () => {
        deepStrictEqual(
            get_identifiers_of_list([
                { file: 'src/page/Page.svelte', root: 'page' },
                { file: 'src/layout/Layout.svelte', root: 'layout' },
                { file: 'src/doc/Doc.svelte', root: 'doc' },

                { file: 'src/test/Test.svelte', root: null },
                { file: 'src/test/Deep.svelte', root: null },
            ]),
            [
                {
                    doc: 'Doc.svelte',
                    identifier: 'doc-layout-page',
                    layout: 'Layout.svelte',
                    page: 'Page.svelte',
                },
            ]
        );
    });
    it('multiple identifier found', async () => {
        deepStrictEqual(
            get_identifiers_of_list([
                { file: 'src/page/Page.svelte', root: 'page' },
                { file: 'src/page/Page2.svelte', root: 'page' },
                { file: 'src/layout/Layout.svelte', root: 'layout' },
                { file: 'src/doc/Doc.svelte', root: 'doc' },

                { file: 'src/test/Test.svelte', root: null },
                { file: 'src/test/Deep.svelte', root: null },
            ]),
            [
                {
                    doc: 'Doc.svelte',
                    identifier: 'doc-layout-page',
                    layout: 'Layout.svelte',
                    page: 'Page.svelte',
                },
                {
                    doc: 'Doc.svelte',
                    identifier: 'doc-layout-page2',
                    layout: 'Layout.svelte',
                    page: 'Page2.svelte',
                },
            ]
        );
    });
});
