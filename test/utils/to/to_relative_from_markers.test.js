import { strictEqual } from 'node:assert';
import { describe } from 'mocha';
import { join } from 'node:path';
import { to_dirname, to_relative_from_markers } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/to/to_relative_from_markers', () => {
    const __dirname = to_dirname(import.meta.url);
    before(() => {
        Cwd.set(__dirname);
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        strictEqual(to_relative_from_markers(), '');
    });
    it('only path', () => {
        strictEqual(to_relative_from_markers('path'), 'path');
    });
    it('only sub path', () => {
        strictEqual(to_relative_from_markers('path/here'), 'path/here');
    });
    it('find marker', () => {
        strictEqual(to_relative_from_markers('path/somewhere/in/os/here', 'path', 'somewhere'), 'in/os/here');
    });
    it('avoid empty path', () => {
        strictEqual(to_relative_from_markers('components/server', 'gen/server', 'server'), 'components/server');
    });
});
