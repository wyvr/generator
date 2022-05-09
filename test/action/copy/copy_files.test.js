import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { copy_files } from '../../../src/action/copy.js';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

describe('action/copy/copy_files', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));

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