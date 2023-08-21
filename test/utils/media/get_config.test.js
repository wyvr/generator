import { deepStrictEqual } from 'assert';
import { join } from 'path';
import { MediaModel } from '../../../src/model/media.js';
import { get_config } from '../../../src/utils/media.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/media/get_config', () => {
    before(() => {
        Cwd.set(process.cwd());
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', async () => {
        deepStrictEqual(
            await get_config(),
            new MediaModel({
                hash: undefined,
                result: undefined,
            })
        );
    });
    it('wrong format', async () => {
        deepStrictEqual(
            await get_config(true),
            new MediaModel({
                hash: undefined,
                result: undefined,
            })
        );
    });
    it('correct format', async () => {
        deepStrictEqual(
            await get_config('"src":"/assets/favicon.png"'),
            new MediaModel({
                format: 'png',
                src: 'assets/favicon.png',
                hash: 'eyJmb3JtYXQiOiJwbmciLCJoZWlnaHQiOi0xLCJtb2RlIjoiY292ZXIiLCJxdWFsaXR5Ijo2MCwid2lkdGgiOi0xfQ==',
                result: '/media/eyJmb3JtYXQiOiJwbmciLCJoZWlnaHQiOi0xLCJtb2RlIjoiY292ZXIiLCJxdWFsaXR5Ijo2MCwid2lkdGgiOi0xfQ==/assets/favicon.png',
            })
        );
    });
    it('missing source', async () => {
        deepStrictEqual(
            await get_config('"width":100'),
            new MediaModel({
                format: 'jpeg',
                width: 100,
                src: undefined,
                hash: undefined,
                result: undefined,
            })
        );
    });
    it('correct format external domain', async () => {
        deepStrictEqual(
            await get_config('"src":"https://wyvr.dev/favicon.png"'),
            new MediaModel({
                format: 'png',
                src: 'https://wyvr.dev/favicon.png',
                hash: 'eyJmb3JtYXQiOiJwbmciLCJoZWlnaHQiOi0xLCJtb2RlIjoiY292ZXIiLCJxdWFsaXR5Ijo2MCwid2lkdGgiOi0xfQ==',
                result: '/media/_d/d3l2ci5kZXY=/eyJmb3JtYXQiOiJwbmciLCJoZWlnaHQiOi0xLCJtb2RlIjoiY292ZXIiLCJxdWFsaXR5Ijo2MCwid2lkdGgiOi0xfQ==/favicon.png',
            })
        );
    });
});
