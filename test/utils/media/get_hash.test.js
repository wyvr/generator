import { deepStrictEqual } from 'node:assert';
import { join } from 'node:path';
import { exists } from '../../../src/utils/file.js';
import { get_hash } from '../../../src/utils/media.js';
import { to_dirname } from '../../../src/utils/to.js';
import { is_buffer } from '../../../src/utils/validate.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/media/get_hash', () => {
    it('undefined', () => {
        deepStrictEqual(get_hash(), 'undefined');
    });
    it('value', () => {
        deepStrictEqual(get_hash('a'), 'YQ==');
    });
    it('wrong format', () => {
        deepStrictEqual(get_hash(true), 'undefined');
    });
});
