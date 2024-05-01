import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { to_dirname } from '../../../src/utils/to.js';
import { extract_tags_from_content } from '../../../src/utils/transform.js';

describe('utils/transform/extract_tags_from_content', () => {
    const __dirname = join(
        to_dirname(import.meta.url),
        '_tests',
        'extract_tags_from_content'
    );

    it('undefined', () => {
        deepStrictEqual(extract_tags_from_content(), {
            content: undefined,
            tags: [],
        });
    });
    it('empty content', () => {
        const content = '';
        deepStrictEqual(extract_tags_from_content(content), {
            content,
            tags: [],
        });
    });
    it('empty content, extract tag', () => {
        const content = '';
        deepStrictEqual(extract_tags_from_content(content, 'script'), {
            content,
            tags: [],
        });
    });
    it('content, extract tag', () => {
        const content = `<html><script>var a = 0;</script></html>`;
        deepStrictEqual(extract_tags_from_content(content, 'script'), {
            content: '<html></html>',
            tags: ['<script>var a = 0;</script>'],
        });
    });
    it('content, extract mulitple tags', () => {
        const content = `<html><script>var a = 0;</script> test <script>var b = 0;</script></html>`;
        deepStrictEqual(extract_tags_from_content(content, 'script'), {
            content: '<html> test </html>',
            tags: ['<script>var a = 0;</script>', '<script>var b = 0;</script>'],
        });
    });
    it('invalid code', () => {
        const content = `<html><script>var a = 0;</html>`;
        deepStrictEqual(extract_tags_from_content(content, 'script'), {
            content,
            tags: [],
        });
    });
    it('self closing tag', () => {
        const content = `<html><script /></html>`;
        deepStrictEqual(extract_tags_from_content(content, 'script'), {
            content,
            tags: [],
        });
    });
    it('content, extract only first tag', () => {
        const content = `<html><script>var a = 0;</script> test <script>var b = 0;</script></html>`;
        deepStrictEqual(extract_tags_from_content(content, 'script', 1), {
            content: '<html> test <script>var b = 0;</script></html>',
            tags: ['<script>var a = 0;</script>'],
        });
    });
});
