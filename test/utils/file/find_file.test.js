import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { find_file } from '../../../src/utils/file.js';

describe('utils/file/find_file', () => {
    it('no value', () => {
        strictEqual(find_file('test/utils/file/_tests', null), undefined);
    });
    it('empty value', () => {
        strictEqual(find_file('test/utils/file/_tests', []), undefined);
    });
    it('wrong value', () => {
        strictEqual(find_file('test/utils/file/_tests', 'valid.json'), undefined);
        strictEqual(find_file('test/utils/file/_tests', 1), undefined);
        strictEqual(find_file('test/utils/file/_tests', true), undefined);
        strictEqual(find_file('test/utils/file/_tests', NaN), undefined);
    });
    it('single', () => {
        strictEqual(find_file('test/utils/file/_tests', ['valid.json']), 'test/utils/file/_tests/valid.json');
    });
    it('first', () => {
        strictEqual(
            find_file('test/utils/file/_tests', ['valid.json', 'invalid.json']),
            'test/utils/file/_tests/valid.json'
        );
    });
    it('second', () => {
        strictEqual(
            find_file('test/utils/file/_tests', ['unknown.json', 'valid.json', 'invalid.json']),
            'test/utils/file/_tests/valid.json'
        );
    });
    it('null/empty', () => {
        strictEqual(
            find_file('test/utils/file/_tests', [null, '', 'valid.json', 'invalid.json']),
            'test/utils/file/_tests/valid.json'
        );
    });
    it('not found', () => {
        strictEqual(find_file('test/utils/file/_tests', [null, '', 'unknown.json']), undefined);
    });
});
