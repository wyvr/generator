import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { copy_files } from '../../../src/action/copy.js';
import { join } from 'node:path';
import { to_dirname } from '../../../src/utils/to.js';

describe('action/copy/copy_files', () => {
    const __dirname = to_dirname(import.meta.url);

    it('undefined', () => {
        const result = copy_files();
        strictEqual(result, false);
    });
    it('empty', () => {
        const result = copy_files([], '');
        strictEqual(result, false);
    });
    it('simple', () => {
        const list = [];
        const files = [{ src: join(__dirname, '_tests/simple/text.txt'), target: 'text.txt' }];
        const result = copy_files(files, join(__dirname, '_tests/_simple'), (file) => {
            list.push(file);
        });
        strictEqual(result, true);
        deepStrictEqual(list, files);
    });
    it('simple without callback', () => {
        const list = [];
        const files = [{ src: join(__dirname, '_tests/simple/text.txt'), target: 'text.txt' }];
        const result = copy_files(files, join(__dirname, '_tests/_simple'));
        strictEqual(result, true);
    });
});
