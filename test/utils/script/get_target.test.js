import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { get_target } from '../../../src/utils/script.js';

describe('utils/script/get_target', () => {
    it('undefined', () => {
        strictEqual(get_target(), '');
    });
    it('wrong type', () => {
        strictEqual(get_target(5), '');
    });
    it('empty', () => {
        strictEqual(get_target(''), '');
    });

    it('should return correct selector if name is filled', () => {
        let name = 'test';
        strictEqual(get_target(name), `const ${name}_target = document.querySelectorAll('[data-hydrate="${name}"]');`);
    });
});