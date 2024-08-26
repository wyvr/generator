import { deepStrictEqual } from 'node:assert';
import { to_media_config } from '../../../../../src/boilerplate/src/wyvr/media.js';

describe('resource/media/to_media_config', () => {
    it('undefined', () => {
        deepStrictEqual(to_media_config(), {});
    });
    it('empty', () => {
        deepStrictEqual(to_media_config(''), {});
    });
    it('single', () => {
        deepStrictEqual(to_media_config('w:100'), {
            width: 100,
        });
    });
    it('single', () => {
        deepStrictEqual(to_media_config('m:cover'), {
            mode: 'cover',
        });
    });
    it('multiple', () => {
        deepStrictEqual(to_media_config('w:100,h:100'), {
            width: 100,
            height: 100,
        });
    });
    it('broken', () => {
        deepStrictEqual(to_media_config('w:100h:100'), {
            width: 100,
        });
    });
    it('unknown prop', () => {
        deepStrictEqual(to_media_config('w:100,?:100'), {
            width: 100,
        });
    });
    it('all contained', () => {
        deepStrictEqual(to_media_config('x:jpg,f:jpeg,h:50,m:cover,q:60,w:100'), {
            width: 100,
            height: 50,
            mode: 'cover',
            format: 'jpeg',
            quality: 60,
            ext: 'jpg',
        });
    });
});
