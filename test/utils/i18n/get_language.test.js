import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { get_language } from '../../../src/utils/i18n.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { to_dirname } from '../../../src/utils/to.js';
import { join } from 'path';

describe('action/i18n/get_language', () => {
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
        const result = get_language();
        deepStrictEqual(result, undefined);
    });
    it('get language translations', () => {
        const result = get_language('de');
        deepStrictEqual(result, {
            key: 'value',
        });
    });
    it('get language translations again from cache', () => {
        const result = get_language('de');
        deepStrictEqual(result, {
            key: 'value',
        });
    });
});
