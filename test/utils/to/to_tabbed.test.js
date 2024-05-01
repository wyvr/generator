import { strictEqual } from 'node:assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { to_tabbed } from '../../../src/utils/to.js';

describe('utils/to/to_tabbed', () => {
    it('undefined', () => {
        strictEqual(to_tabbed(), '');
    });
    it('string', () => {
        strictEqual(to_tabbed('hello world'), '');
        strictEqual(to_tabbed('hello world2', 2), '');
    });
    it('empty array', () => {
        strictEqual(to_tabbed([]), '');
        strictEqual(to_tabbed([], 2), '');
    });
    it('array', () => {
        strictEqual(to_tabbed(['1', '2']), '1\n2');
        strictEqual(to_tabbed(['1', '2'], 2), '1\n2');
    });
    it('array, tabbed', () => {
        strictEqual(to_tabbed([['1', '2']]), `    1\n    2`);
        strictEqual(to_tabbed([['1', '2']], 2), `  1\n  2`);
    });
    it('array, tabbed deep', () => {
        strictEqual(
            to_tabbed([['1', ['2', ['3', [['4'], '5']]]]]),
            `    1\n        2\n            3\n                    4\n                5`
        );
        strictEqual(to_tabbed([['1', ['2', ['3', [['4'], '5']]]]], 2), `  1\n    2\n      3\n          4\n        5`);
    });
});
