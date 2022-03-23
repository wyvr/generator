import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { remove_index } from '../../../src/utils/file.js';
import { v4 } from 'uuid';
import { dirname, join, sep } from 'path';
import { existsSync, rmSync } from 'fs';

describe('utils/file/remove_index', () => {
    it('undefined', () => {
        strictEqual(remove_index(null), '');
    });
    it('null', () => {
        strictEqual(remove_index(null), '');
    });
    it('number', () => {
        strictEqual(remove_index(13), '');
    });
    it('bool', () => {
        strictEqual(remove_index(true), '');
    });
    it('array', () => {
        strictEqual(remove_index(['some', 'array']), '');
    });
    it('object', () => {
        strictEqual(remove_index({ a: true }), '');
    });
    it('single', () => {
        const folder = join(v4().split('-')[0]);
        const name = join(folder, 'index.html');

        strictEqual(remove_index(name), folder + sep);
    });
    it('deep', () => {
        const folder = join(...v4().split('-'));
        const name = join(folder, 'index.html');
        strictEqual(remove_index(name), folder + sep);
    });
});
