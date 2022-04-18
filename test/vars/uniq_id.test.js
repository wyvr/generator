import { strictEqual } from 'assert';
import { after, describe, it } from 'mocha';
import { UniqId } from '../../src/vars/uniq_id.js';

describe('vars/uniq_id', () => {
    afterEach(() => {
        UniqId.value = undefined;
    });
    it('undefined', () => {
        UniqId.set(undefined);
        strictEqual(UniqId.get().length, 32);
    });
    it('custom value', () => {
        UniqId.set('huhu');
        strictEqual(UniqId.get(), 'huhu');
    });
    it('load', () => {
        UniqId.get();
        UniqId.value = undefined;
        const id = UniqId.load();
        strictEqual(id.length, 32);
    });
});
