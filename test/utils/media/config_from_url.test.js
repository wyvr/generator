import { deepStrictEqual } from 'assert';
import { join } from 'path';
import { clear_cache, config_from_url } from '../../../src/utils/media.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { MediaModel } from '../../../src/model/media.js';
import { Config } from '../../../src/utils/config.js';

describe('utils/media/config_from_url', () => {
    const original = Config.get();
    before(() => {
        Cwd.set(join(process.cwd(), 'test', 'utils', 'media'));
    });
    after(() => {
        Cwd.set(undefined);
    });
    afterEach(() => {
        Config.replace(original);
        clear_cache();
    });
    it('undefined', async () => {
        deepStrictEqual(await config_from_url(), undefined);
    });
    it('no media url', async () => {
        deepStrictEqual(await config_from_url('/assets/favicon.png'), undefined);
    });
    it('media url', async () => {
        deepStrictEqual(
            await config_from_url('/media/ZjpwbmcsbTpjb3ZlcixxOjYw/assets/favicon.png'),
            new MediaModel({
                format: 'png',
                height: -1,
                mode: 'cover',
                output: 'path',
                quality: 60,
                result: '/media/ZjpwbmcsbTpjb3ZlcixxOjYw/assets/favicon.png',
                result_exists: false,
                src: 'assets/favicon.png',
                width: -1,
            })
        );
    });
    it('external media url', async () => {
        Config.set('media.allowed_domains', {
            wyvr: 'https://wyvr.dev',
        });
        deepStrictEqual(
            await config_from_url('/media/_d/c255e313/ZjpwbmcsbTpjb3ZlcixxOjYw/favicon.png'),
            new MediaModel({
                domain: 'https://wyvr.dev',
                format: 'png',
                height: -1,
                mode: 'cover',
                output: 'path',
                quality: 60,
                result: '/media/_d/c255e313/ZjpwbmcsbTpjb3ZlcixxOjYw/favicon.png',
                result_exists: false,
                src: 'https://wyvr.dev/favicon.png',
                width: -1,
            })
        );
    });
    it('external media url with defined extension', async () => {
        deepStrictEqual(
            await config_from_url(
                '/media/_d/c255e313/ZjpwbmcsbTpjb3ZlcixxOjYwLHg6cG5n/favicon.png'
            ),
            new MediaModel({
                domain: 'https://wyvr.dev',
                ext: 'png',
                format: 'png',
                height: -1,
                mode: 'cover',
                output: 'path',
                quality: 60,
                result: '/media/_d/c255e313/ZjpwbmcsbTpjb3ZlcixxOjYwLHg6cG5n/favicon.png',
                result_exists: false,
                src: 'https://wyvr.dev/favicon.png',
                width: -1,
            })
        );
    });
    it('invalid hash', async () => {
        deepStrictEqual(
            await config_from_url('/media/hash/assets/favicon.png'),
            new MediaModel({
                format: 'jpeg',
                height: -1,
                mode: 'cover',
                output: 'path',
                quality: 60,
                result: '/media/hash/assets/favicon.png',
                result_exists: false,
                src: 'assets/favicon.png',
                width: -1,
            })
        );
    });
    it('invalid domain hash', async () => {
        deepStrictEqual(await config_from_url('/media/_d/domain/hash2/assets/favicon.png'), undefined);
    });
    it('not enough domain params', async () => {
        deepStrictEqual(await config_from_url('/media/_d/'), undefined);
    });
});
