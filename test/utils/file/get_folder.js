import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { get_folder } from '../../../src/utils/file.js';

describe('utils/file/get_folder', () => {
    it('null', () => {
        strictEqual(get_folder(), undefined);
        strictEqual(get_folder(null), undefined);
        strictEqual(get_folder(undefined), undefined);
        strictEqual(get_folder(1), undefined);
        strictEqual(get_folder(true), undefined);
    });
    it('non existing', () => {
        strictEqual(get_folder('test/utils/file/_tests/nonexisting'), undefined);
    });
    it('existing', () => {
        deepStrictEqual(get_folder('test/utils/file/_tests/folder'), [
            { name: '1', path: 'test/utils/file/_tests/folder/1' },
        ]);
    });
    it('existing empty', () => {
        deepStrictEqual(get_folder('test/utils/file/_tests/folder/1'), []);
    });
});
