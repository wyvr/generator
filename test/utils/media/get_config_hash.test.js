import { deepStrictEqual } from 'node:assert';
import { get_config_hash } from '../../../src/utils/media.js';

describe('utils/media/get_config_hash', () => {
    it('undefined', () => {
        deepStrictEqual(get_config_hash(), '_');
    });
    it('wrong format', () => {
        deepStrictEqual(get_config_hash(true), '_');
    });
    it('empty', () => {
        deepStrictEqual(get_config_hash({}), '_');
    });
    it('value', () => {
        deepStrictEqual(get_config_hash({ width: 10, height: 10 }), 'aDoxMCx3OjEw');
    });
});
