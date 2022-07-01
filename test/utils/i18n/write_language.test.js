import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { write_language } from '../../../src/utils/i18n.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { to_dirname } from '../../../src/utils/to.js';
import { read, remove } from '../../../src/utils/file.js';
import { join } from 'path';

describe('action/i18n/write_language', () => {
    const __dirname = join(to_dirname(import.meta.url), '_tests');

    before(() => {
        Cwd.set(__dirname);
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        const result = write_language();
        strictEqual(result, false);
    });
    it('undefined', () => {
        const result = write_language('ES', { test: 'test' });
        const file = join(__dirname, 'gen', 'i18n', 'es.json');
        const content = read(file);
        remove(file);
        strictEqual(result, true);
        strictEqual(content, '{"test":"test"}');
    });
});
