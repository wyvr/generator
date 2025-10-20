import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { get_class_code } from '../../../src/utils/script.js';

describe('get_class_code', () => {
    it('empty name', () => {
        strictEqual(get_class_code('', 'import_path'), '');
    });
    it('empty import_path', () => {
        strictEqual(get_class_code('name', ''), '');
    });
    it('all parameters are filled, so create result', () => {
        strictEqual(
            get_class_code('test', '/some/path'),
            [
                `import test from '/some/path';`,
                "wyvr_class(test, 'test');",
            ].join('')
        );
    });
});
