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
            files: [],
            identifiers_of_file: {
                doc: [],
                layout: [],
                page: [],
            },
        });
    });
    it('identifier found', async () => {
        deepStrictEqual(
            get_identifiers_of_file(
                {
                    'test/Test.svelte': ['page/Test.svelte'],
                },
                'test/Test.svelte'
            ),
            {
                files: ['test/Test.svelte', 'page/Test.svelte'],
                identifiers_of_file: [
                    {
                        doc: 'Default.js',
                        identifier: 'default-default-test',
                        layout: 'Default.js',
                        page: 'Test.svelte',
                    },
                ],
            }
        );
    });
});
