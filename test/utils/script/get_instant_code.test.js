import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { get_instant_code, get_target_code } from '../../../src/utils/script.js';

describe('get_instant_code', () => {
    it('empty name', () => {
        strictEqual(get_instant_code('', 'import_path', 'target'), '');
    });
    it('empty mport_path', () => {
        strictEqual(get_instant_code('name', '', 'target'), '');
    });

    it('show error, when no target is present', () => {
        strictEqual(
            get_instant_code('test', '/some/path', ''),
            ''
        );
    });
    it('all parameters are filled, so create result', () => {
        const target = get_target_code('test');
        strictEqual(
            get_instant_code('test', '/some/path', target),
            [`import test from '/some/path';`, target, `wyvr_hydrate_instant(test_target, test, 'test');`].join('')
        );
    });
});
