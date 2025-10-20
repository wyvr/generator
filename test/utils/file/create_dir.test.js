import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { create_dir } from '../../../src/utils/file.js';
import { dirname, join } from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

describe('utils/file/create_dir', () => {
    it('empty', () => {
        create_dir();
    });
    it('single', () => {
        const name = join(randomUUID().split('-')[0], 'test.txt');
        strictEqual(existsSync(dirname(name)), false);
        create_dir(name);
        strictEqual(existsSync(dirname(name)), true);
        rmSync(dirname(name), { recursive: true, force: true });
    });
    it('deep', () => {
        const name = join(...randomUUID().split('-'), 'test.txt');
        strictEqual(existsSync(dirname(name)), false);
        create_dir(name);
        strictEqual(existsSync(dirname(name)), true);
        rmSync(name.split('/')[0], { recursive: true, force: true });
    });
});
