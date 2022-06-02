import { deepStrictEqual } from 'assert';
import { describe } from 'mocha';
import { join } from 'path';
import { FOLDER_GEN_SERVER } from '../../../src/constants/folder.js';
import { to_dirname, to_identifier_name } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/to/to_identifier_name', () => {
    const path = join(process.cwd(), 'test', 'worker_action', '_tests', 'process_page_data', FOLDER_GEN_SERVER);
    before(() => {});
    after(() => {});
    it('undefined', () => {
        deepStrictEqual(to_identifier_name(), 'default');
    });
    it('default shrinking', () => {
        deepStrictEqual(
            to_identifier_name(
                join(path, 'doc', 'Default.svelte'),
                join(path, 'layout', 'Default.svelte'),
                join(path, 'page', 'Default.svelte')
            ),
            'default'
        );
    });
    it('simple', () => {
        deepStrictEqual(
            to_identifier_name(
                join(path, 'doc', 'Doc.svelte'),
                join(path, 'layout', 'Layout.svelte'),
                join(path, 'page', 'Page.svelte')
            ),
            'doc-layout-page'
        );
    });
    it('with paths', () => {
        deepStrictEqual(
            to_identifier_name(
                join(path, 'doc', 'test', 'Doc.svelte'),
                join(path, 'layout', 'test', 'Layout.svelte'),
                join(path, 'page', 'test', 'test', 'Page.svelte')
            ),
            'test_doc-test_layout-test_test_page'
        );
    });
});
