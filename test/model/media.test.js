import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { MediaModel } from '../../src/model/media.js';

describe('model/media', () => {
    it('undefined', () => {
        const media = new MediaModel();
        const result = {
            domain: undefined,
            format: 'jpeg',
            hash: undefined,
            height: -1,
            mode: 'cover',
            output: 'path',
            quality: 60,
            result: undefined,
            src: undefined,
            width: -1,
        };
        let key = 'src';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'domain';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'format';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'hash';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'height';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'mode';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'output';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'quality';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'result';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'src';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'width';
        strictEqual(media[key], result[key], 'prop ' + key);
    });
    it('values', () => {
        const result = {
            domain: 'domain',
            format: 'png',
            hash: '#',
            height: 100,
            mode: 'contain',
            output: 'value',
            quality: 100,
            result: 'result',
            src: 'src',
            width: 150,
        };
        const media = new MediaModel(result);
        let key = 'src';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'domain';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'format';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'hash';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'height';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'mode';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'output';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'quality';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'result';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'src';
        strictEqual(media[key], result[key], 'prop ' + key);
        key = 'width';
        strictEqual(media[key], result[key], 'prop ' + key);
    });
    it('set invalid values', () => {
        const media = new MediaModel({invalid: true});
        strictEqual(media.invalid, undefined);
    });
});
