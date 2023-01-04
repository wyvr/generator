import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { collect_files, read_json, remove } from '../../../src/utils/file.js';
import { write_identifier_structure } from '../../../src/utils/structure.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { ReleasePath } from '../../../src/vars/release_path.js';

describe('utils/structure/write_identifier_structure', () => {
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
        ReleasePath.set(path);
    });
    beforeEach(() => {});
    afterEach(() => {
        collect_files(path).forEach((file) => {
            remove(file);
        });
    });
    after(() => {
        Cwd.set(undefined);
        ReleasePath.set(undefined);
    });
    it('undefined', async () => {
        write_identifier_structure();
        deepStrictEqual(collect_files(path), []);
    });
    it('unknown identifier', async () => {
        write_identifier_structure({ huhu: true }, {}, {}, {});
        deepStrictEqual(collect_files(path), []);
    });
    it('missing tree', async () => {
        write_identifier_structure({
            identifier: 'default',
            doc: 'Default.js',
            layout: 'Default.js',
            page: 'Default.js',
        });
        deepStrictEqual(collect_files(path), []);
    });
    it('missing file_config', async () => {
        write_identifier_structure(
            { identifier: 'default', doc: 'Default.js', layout: 'Default.js', page: 'Default.js' },
            {}
        );
        deepStrictEqual(collect_files(path), []);
    });
    it('missing package_tree', async () => {
        write_identifier_structure(
            { identifier: 'default', doc: 'Default.js', layout: 'Default.js', page: 'Default.js' },
            {},
            {}
        );
        deepStrictEqual(collect_files(path), []);
    });
    it('create structure', async () => {
        write_identifier_structure(
            { identifier: 'default', doc: 'Default.js', layout: 'Default.js', page: 'Default.js' },
            {},
            {},
            {}
        );
        deepStrictEqual(collect_files(path), [join(path, 'default.json')]);
        deepStrictEqual(read_json(join(path, 'default.json')), {
            doc: { file: 'src/doc/Default.svelte', components: [] },
            layout: { file: 'src/layout/Default.svelte', components: [] },
            page: { file: 'src/page/Default.svelte', components: [] },
        });
    });
});
