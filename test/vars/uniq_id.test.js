import { strictEqual } from 'node:assert';
import { after, describe, it } from 'mocha';
import { join } from 'node:path';
import { to_dirname } from '../../src/utils/to.js';
import { Cwd } from '../../src/vars/cwd.js';
import { UniqId } from '../../src/vars/uniq_id.js';
import { read_raw, write } from '../../src/utils/file.js';

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
    it('load wrong value', () => {
        Cwd.set(
            join(to_dirname(import.meta.url), '_tests', 'uniq_id', 'echoed')
        );
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
    it('persist', () => {
        const source = join(
            to_dirname(import.meta.url),
            '_tests',
            'uniq_id',
            'persist'
        );
        Cwd.set(source);
        const id = UniqId.load();
        const persist_value = new Date().getTime();
        UniqId.set(persist_value.toString());
        UniqId.persist();
        const persisted = read_raw(join(source, 'cache', 'uniq'));
        write(join(source, 'cache', 'uniq'), id);
        Cwd.set(undefined);
        strictEqual(persisted, persist_value.toString());
    });
});
