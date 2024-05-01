import { deepStrictEqual } from 'node:assert';
import { join } from 'node:path';
import { exists } from '../../../src/utils/file.js';
import { get_config_from_content } from '../../../src/utils/media.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/media/get_config_from_content', () => {
    before(() => {
        Cwd.set(process.cwd());
    });
    after(() => {
        Cwd.set(undefined);
    });
    // it('undefined', async () => {});
    it('undefined', async () => {
        const result = await get_config_from_content(undefined);
        deepStrictEqual(result, undefined);
    });
    it('empty', async () => {
        const result = await get_config_from_content('');
        deepStrictEqual(result, undefined);
    });
    it('no media', async () => {
        const result = await get_config_from_content('huhu');
        deepStrictEqual(result, undefined);
    });
    it('media', async () => {
        const result = await get_config_from_content(
            "src:'assets/slider/1.jpg', width: 100, height: 50, mode: 'cover', format: 'webp'"
        );
        deepStrictEqual(result, {
            format: 'webp',
            height: 50,
            mode: 'cover',
            src: 'assets/slider/1.jpg',
            width: 100,
        });
    });
});
