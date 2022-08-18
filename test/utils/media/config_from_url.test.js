import { deepStrictEqual } from 'assert';
import { join } from 'path';
import { config_from_url } from '../../../src/utils/media.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/media/config_from_url', () => {
    before(() => {
        Cwd.set(join(process.cwd(), 'test', 'utils', 'media'));
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        deepStrictEqual(config_from_url(), undefined);
    });
    it('no media url', () => {
        deepStrictEqual(config_from_url('/assets/favicon.png'), undefined);
    });
    it('media url', () => {
        deepStrictEqual(
            config_from_url(
                '/media/eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6InBuZyIsInF1YWxpdHkiOjYwfQ==/assets/favicon.png'
            ),
            {
                format: 'png',
                height: -1,
                mode: 'cover',
                output: 'path',
                quality: 60,
                result: '/media/eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6InBuZyIsInF1YWxpdHkiOjYwfQ==/assets/favicon.png',
                result_exists: false,
                src: 'assets/favicon.png',
                width: -1,
            }
        );
    });
    it('external media url', () => {
        deepStrictEqual(
            config_from_url(
                '/media/_d/d3l2ci5kZXY=/eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6InBuZyIsInF1YWxpdHkiOjYwfQ==/favicon.png'
            ),
            {
                domain: 'wyvr.dev',
                format: 'png',
                height: -1,
                mode: 'cover',
                output: 'path',
                quality: 60,
                result: '/media/_d/d3l2ci5kZXY=/eyJ3aWR0aCI6LTEsImhlaWdodCI6LTEsIm1vZGUiOiJjb3ZlciIsImZvcm1hdCI6InBuZyIsInF1YWxpdHkiOjYwfQ==/favicon.png',
                result_exists: false,
                src: 'https://wyvr.dev/favicon.png',
                width: -1,
            }
        );
    });
    it('invalid hash', () => {
        deepStrictEqual(config_from_url('/media/hash/assets/favicon.png'), {
            format: 'jpeg',
            height: -1,
            mode: 'cover',
            output: 'path',
            quality: 60,
            result: '/media/hash/assets/favicon.png',
            result_exists: false,
            src: 'assets/favicon.png',
            width: -1,
        });
    });
    it('invalid domain hash', () => {
        deepStrictEqual(config_from_url('/media/_d/domain/hash2/assets/favicon.png'), {
            domain: 'v\t\u001a\n',
            format: 'jpeg',
            height: -1,
            mode: 'cover',
            output: 'path',
            quality: 60,
            result: '/media/_d/domain/hash2/assets/favicon.png',
            result_exists: false,
            src: 'https://v\t\u001a\n/assets/favicon.png',
            width: -1,
        });
    });
    it('not enough domain params', () => {
        deepStrictEqual(config_from_url('/media/_d/'), undefined);
    });
});
