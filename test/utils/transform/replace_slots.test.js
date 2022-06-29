import { strictEqual } from 'assert';
import { replace_slots, replace_slots_static } from '../../../src/utils/transform.js';

describe('utils/transform/replace_slots', () => {
    it('undefined', () => {
        strictEqual(replace_slots(), '');
    });
    it('null', () => {
        strictEqual(replace_slots(null), '');
    });
    it('empty', () => {
        strictEqual(replace_slots(''), '');
    });
});
