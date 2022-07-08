import { deepStrictEqual } from 'assert';
import { join } from 'path';
import { exists } from '../../../src/utils/file.js';
import { correct_format } from '../../../src/utils/media.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/media/correct_format', () => {
    before(() => {
        Cwd.set(process.cwd());
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        deepStrictEqual(correct_format(), undefined);
    });
    it('format no src', () => {
        deepStrictEqual(correct_format('png'), 'png');
    });
    it('correct format no src', () => {
        deepStrictEqual(correct_format('jpg'), 'jpeg');
    });
    it('null format no src', () => {
        deepStrictEqual(correct_format('null'), undefined);
    });
    it('format with src', () => {
        deepStrictEqual(correct_format('png', 'test.jpg'), 'png');
    });
    it('correct null format no src', () => {
        deepStrictEqual(correct_format('null', 'test.jpg'), 'jpeg');
    });
    it('correct format with src', () => {
        deepStrictEqual(correct_format('jpg', 'test.png'), 'jpeg');
    });
    it('no format with src', () => {
        deepStrictEqual(correct_format(undefined, 'test.png'), 'png');
    });
    it('empty format with src', () => {
        deepStrictEqual(correct_format('', 'test.png'), 'png');
    });
    it('correct empty format with src', () => {
        deepStrictEqual(correct_format(undefined, 'test.jpg'), 'jpeg');
    });
});
