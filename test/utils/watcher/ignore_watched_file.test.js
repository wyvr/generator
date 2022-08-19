import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { ignore_watched_file } from '../../../src/utils/watcher.js';

describe('utils/watcher/ignore_watched_file', () => {
    it('undefined', () => {
        strictEqual(ignore_watched_file(), true);
    });
    it('process file', () => {
        strictEqual(ignore_watched_file('change', 'test'), false);
    });
    it('addDir', () => {
        strictEqual(ignore_watched_file('addDir', 'test'), true);
    });
    it('unlinkDir', () => {
        strictEqual(ignore_watched_file('unlinkDir', 'test'), true);
    });
    it('git folder', () => {
        strictEqual(ignore_watched_file('change', 'test/.git/test'), true);
    });
    it('node_modules folder', () => {
        strictEqual(ignore_watched_file('change', 'test/node_modules/test'), true);
    });
    it('package.json', () => {
        strictEqual(ignore_watched_file('change', 'test/package.json'), true);
    });
    it('package-lock.json', () => {
        strictEqual(ignore_watched_file('change', 'test/package-lock.json'), true);
    });
});
