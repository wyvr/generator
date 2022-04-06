import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { write_language } from '../../../src/action/i18n.js';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { Cwd } from '../../../src/vars/cwd.js';

describe('action/i18n/write_language', () => {
    const cwd = Cwd.get();

    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));

    afterEach(() => {
        Cwd.set(cwd);
    });
    it('undefined', () => {
        const result = write_language();
       strictEqual(result, false);
    });
});
