import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { get_target_code } from '../../../src/utils/script.js';

describe('utils/script/get_target_code', () => {
    it('undefined', () => {
        strictEqual(get_target_code(), '');
    });
    it('wrong type', () => {
        strictEqual(get_target_code(5), '');
    });
    it('empty', () => {
        strictEqual(get_target_code(''), '');
    });

    it('should return correct selector if name is filled', () => {
        let name = 'test';
        strictEqual(get_target_code(name), `const ${name}_target = document.querySelectorAll('[data-hydrate="${name}"]');`);
    });
});