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
                hash: 'eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6InBuZyIsInF1YWxpdHkiOjYwLCJzcmMiOiJhc3NldHMvZmF2aWNvbi5wbmcifQ==',
                result: '/media/eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6InBuZyIsInF1YWxpdHkiOjYwLCJzcmMiOiJhc3NldHMvZmF2aWNvbi5wbmcifQ==/assets/favicon.png',
            })
        );
    });
    it('correct format external domain', async () => {
        deepStrictEqual(
            await get_config('"src":"https://wyvr.dev/favicon.png"'),
            new MediaModel({
                format: 'png',
                src: 'https://wyvr.dev/favicon.png',
                hash: 'eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6InBuZyIsInF1YWxpdHkiOjYwLCJzcmMiOiJodHRwczovL3d5dnIuZGV2L2Zhdmljb24ucG5nIn0=',
                result: '/media/_d/d3l2ci5kZXY=/eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6InBuZyIsInF1YWxpdHkiOjYwLCJzcmMiOiJodHRwczovL3d5dnIuZGV2L2Zhdmljb24ucG5nIn0=/favicon.png',
            })
        );
    });
});
