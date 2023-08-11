import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { contains_reserved_words } from '../../../src/utils/reserved_words.js';

describe('utils/reserved_words/contains_reserved_words', () => {
    it('should return true if path contains reserved words', function () {
        strictEqual(contains_reserved_words('/assets/sample.png'), true);
        strictEqual(contains_reserved_words('/css/style.css'), true);
        strictEqual(contains_reserved_words('/devtools/tool.js'), true);
        strictEqual(contains_reserved_words('/i18n/en.json'), true);
        strictEqual(contains_reserved_words('/js/script.js'), true);
        strictEqual(contains_reserved_words('/media/video.mp4'), true);
    });

    it('should return false if path does not contain reserved words', function () {
        strictEqual(contains_reserved_words('/images/sample.png'), false);
        strictEqual(contains_reserved_words('/styles/style.css'), false);
    });

    it('should return false if input is not a string', function () {
        strictEqual(contains_reserved_words(true), false);
        strictEqual(contains_reserved_words(12345), false);
        strictEqual(contains_reserved_words({}), false);
        strictEqual(contains_reserved_words([]), false);
    });
});
