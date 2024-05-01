import { deepStrictEqual } from 'node:assert';
import { to_media_hash } from '../../../../../src/boilerplate/src/wyvr/media.js';

describe('resource/media/to_media_hash', () => {
    it('undefined', () => {
        deepStrictEqual(to_media_hash(), '');
    });
    it('empty', () => {
        deepStrictEqual(to_media_hash(''), '');
    });
    it('single number', () => {
        deepStrictEqual(
            to_media_hash({
                width: 100,
            }),
            'w:100'
        );
    });
    it('single string', () => {
        deepStrictEqual(
            to_media_hash({
                mode: 'contain',
            }),
            'm:contain'
        );
    });
    it('multiple', () => {
        deepStrictEqual(
            to_media_hash({
                width: 100,
                height: 100,
            }),
            'h:100,w:100'
        );
    });
    it('array', () => {
        deepStrictEqual(
            to_media_hash([
                {
                    width: 100,
                },
            ]),
            ''
        );
    });
    it('unknown', () => {
        deepStrictEqual(
            to_media_hash({
                width: 100,
                test: 'huhu',
            }),
            'w:100'
        );
    });
    it('all contained', () => {
        deepStrictEqual(
            to_media_hash({
                width: 100,
                height: 50,
                mode: 'contain',
                format: 'png',
                quality: 90,
                ext: 'webp',
            }),
            'f:png,h:50,m:contain,q:90,w:100,x:webp'
        );
    });
    it('ignore default parameters', () => {
        deepStrictEqual(
            to_media_hash({
                width: -1,
                height: -1,
                mode: 'cover',
                format: 'jpeg',
                quality: 60,
                ext: undefined,
            }),
            ''
        );
    });
});
