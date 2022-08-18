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
                hash: 'eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6ImpwZWciLCJxdWFsaXR5Ijo2MH0=',
                result: '/media/eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6ImpwZWciLCJxdWFsaXR5Ijo2MH0=/',
            })
        );
    });
    it('wrong format', async () => {
        deepStrictEqual(
            await get_config(true),
            new MediaModel({
                hash: 'eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6ImpwZWciLCJxdWFsaXR5Ijo2MH0=',
                result: '/media/eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6ImpwZWciLCJxdWFsaXR5Ijo2MH0=/',
            })
        );
    });
    it('correct format', async () => {
        deepStrictEqual(
            await get_config('"src":"/assets/favicon.png"'),
            new MediaModel({
                format: 'png',
                src: 'assets/favicon.png',
                hash: 'eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6InBuZyIsInF1YWxpdHkiOjYwfQ==',
                result: '/media/eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6InBuZyIsInF1YWxpdHkiOjYwfQ==/assets/favicon.png',
            })
        );
    });
    it('correct format external domain', async () => {
        deepStrictEqual(
            await get_config('"src":"https://wyvr.dev/favicon.png"'),
            new MediaModel({
                format: 'png',
                src: 'https://wyvr.dev/favicon.png',
                hash: 'eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6InBuZyIsInF1YWxpdHkiOjYwfQ==',
                result: '/media/_d/d3l2ci5kZXY=/eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6InBuZyIsInF1YWxpdHkiOjYwfQ==/favicon.png',
            })
        );
    });
});
