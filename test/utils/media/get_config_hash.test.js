import { deepStrictEqual } from 'assert';
import { get_config_hash } from '../../../src/utils/media.js';

describe('utils/media/get_config_hash', () => {
    it('undefined', () => {
        deepStrictEqual(get_config_hash(), 'undefined');
    });
    it('wrong format', () => {
        deepStrictEqual(get_config_hash(true), 'undefined');
    });
    it('empty', () => {
        deepStrictEqual(get_config_hash({}), 'empty');
    });
    it('value', () => {
        deepStrictEqual(get_config_hash({ width: 10, height: 10 }), 'eyJoZWlnaHQiOjEwLCJ3aWR0aCI6MTB9');
    });
});
