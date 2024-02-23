import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { insert_script_import } from '../../../src/utils/script.js';

describe('utils/script/insert_script_import', () => {
    it('empty file', () => {
        const result = insert_script_import('', 'exports');
        deepStrictEqual(result, '');
    });

    it('empty exports', () => {
        const result = insert_script_import('file.js', '');
        deepStrictEqual(result, "import 'file.js';");
    });

    it('null exports', () => {
        const result = insert_script_import('file.js', null);
        deepStrictEqual(result, "import 'file.js';");
    });

    it('file and exports', () => {
        const result = insert_script_import('file.js', 'exports');
        deepStrictEqual(result, "import { exports } from 'file.js';");
    });
});
