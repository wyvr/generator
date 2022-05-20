import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { write_language } from '../../../src/action/i18n.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { to_dirname } from '../../../src/utils/to.js';

describe('action/i18n/write_language', () => {
    const cwd = Cwd.get();

    const __dirname = to_dirname(import.meta.url);

    afterEach(() => {
        Cwd.set(cwd);
    });
    it('undefined', () => {
        const result = write_language();
       strictEqual(result, false);
    });
});
