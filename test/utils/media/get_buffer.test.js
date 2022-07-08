import { deepStrictEqual } from 'assert';
import { join } from 'path';
import { exists } from '../../../src/utils/file.js';
import { get_buffer } from '../../../src/utils/media.js';
import { to_dirname } from '../../../src/utils/to.js';
import { is_buffer } from '../../../src/utils/validate.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/media/get_buffer', () => {
    before(() => {
        Cwd.set(join(to_dirname(import.meta.url), '_tests'));
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', async () => {
        deepStrictEqual(await get_buffer(), undefined);
    });
    it('non existing local file', async () => {
        deepStrictEqual(await get_buffer('nonexisting.png'), undefined);
    });
    it('read local file', async () => {
        deepStrictEqual(is_buffer(await get_buffer('favicon.png')), true);
    });
    it('read asset file', async () => {
        deepStrictEqual(is_buffer(await get_buffer('/assets/favicon.png')), true);
    });
    it('download file', async () => {
        deepStrictEqual(is_buffer(await get_buffer('https://wyvr.dev/favicon.png')), true);
    });
    it('download non existing file', async () => {
        deepStrictEqual(await get_buffer('https://wyvr.dev/nonexisting_file.png'), undefined);
    });
});
