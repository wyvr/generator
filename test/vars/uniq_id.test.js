import { strictEqual } from 'node:assert';
import { after, describe, it } from 'mocha';
import { join } from 'node:path';
import { to_dirname } from '../../src/utils/to.js';
import { Cwd } from '../../src/vars/cwd.js';
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
    it('load wrong value', () => {
        Cwd.set(join(to_dirname(import.meta.url), '_tests', 'uniq_id', 'echoed'));
        const id = UniqId.load();
        Cwd.set(undefined);
        strictEqual(id, 'test');
    });
    it('load non existing value', () => {
        Cwd.set(join(to_dirname(import.meta.url), '_tests', 'uniq_id', 'non'));
        const id = UniqId.load();
        Cwd.set(undefined);
        strictEqual(id, undefined);
    });
});
