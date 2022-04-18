import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { create_dir } from '../../../src/utils/file.js';
import { v4 } from 'uuid';
import { dirname, join } from 'path';
import { existsSync, rmSync } from 'fs';

describe('utils/file/create_dir', () => {
    it('empty', () => {
        create_dir();
    });
    it('single', () => {
        const name = join(v4().split('-')[0], 'test.txt');
        strictEqual(existsSync(dirname(name)), false);
        create_dir(name);
        strictEqual(existsSync(dirname(name)), true);
        rmSync(dirname(name), { recursive: true, force: true });
    });
    it('deep', () => {
        const name = join(...v4().split('-'), 'test.txt');
        strictEqual(existsSync(dirname(name)), false);
        create_dir(name);
        strictEqual(existsSync(dirname(name)), true);
        rmSync(name.split('/')[0], { recursive: true, force: true });
    });
});
