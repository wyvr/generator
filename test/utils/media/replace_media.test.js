import { deepStrictEqual } from 'node:assert';
import { MediaModel } from '../../../src/model/media.js';
import { replace_media } from '../../../src/utils/media.js';

describe('utils/media/replace_media', () => {
    it('undefined', async () => {
        deepStrictEqual(await replace_media(), {
            content: '',
            media: {},
            has_media: false,
        });
    });
    it('empty content', async () => {
        deepStrictEqual(await replace_media(''), {
            content: '',
            media: {},
            has_media: false,
        });
    });
    it('content without media', async () => {
        deepStrictEqual(await replace_media('a(b)c'), {
            content: 'a(b)c',
            media: {},
            has_media: false,
        });
    });
    it('content with media', async () => {
        deepStrictEqual(await replace_media(`<img src="(media(src: '/assets/favicon.png'))" />`), {
            content:
                '<img src="/media/Zjpwbmc=/assets/favicon.png" />',
            media: {
                '/media/Zjpwbmc=/assets/favicon.png':
                    new MediaModel({
                        domain: undefined,
                        format: 'png',
                        hash: 'Zjpwbmc=',
                        mode: 'cover',
                        output: 'path',
                        quality: 60,
                        result: '/media/Zjpwbmc=/assets/favicon.png',
                        result_exists: false,
                        src: 'assets/favicon.png',
                        width: -1,
                    }),
            },
            has_media: true,
        });
    });
});
