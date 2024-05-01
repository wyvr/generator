import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { inject_language } from '../../../src/utils/i18n.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { to_dirname } from '../../../src/utils/to.js';
import { join } from 'node:path';

describe('action/i18n/inject_language', () => {
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
        const result = inject_language();
        deepStrictEqual(result, '');
    });
    it('no body', () => {
        const result = inject_language('test');
        deepStrictEqual(result, 'test');
    });
    it('no language', () => {
        const result = inject_language('test</body>');
        deepStrictEqual(result, 'test</body>');
    });
    it('insert language', () => {
        const result = inject_language('test</body>', 'de');
        deepStrictEqual(
            result,
            'test<script>\n' +
                '    window._translation = {"key":"value"};\n' +
                '\n' +
                '    if(window._i18n) {\n' +
                '        window._i18n.set(window._translation);\n' +
                '    }\n' +
                '    </script>'
        );
    });
});
