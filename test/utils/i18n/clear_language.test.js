import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { get_language, clear_language } from '../../../src/utils/i18n.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { to_dirname } from '../../../src/utils/to.js';
import { join } from 'path';

describe('action/i18n/clear_language', () => {
    const __dirname = to_dirname(import.meta.url);

    before(() => {});
    beforeEach(() => {
        Cwd.set(join(__dirname, '_tests'));
    });
    afterEach(() => {});
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        const result = clear_language();
        deepStrictEqual(result, false);
    });
    it('clear language which is not existing', () => {
        const result = clear_language('es');
        deepStrictEqual(result, false);
    });
    it('clear existing language', () => {
        get_language('de');
        const result = clear_language('de');
        deepStrictEqual(result, true);
    });
});
