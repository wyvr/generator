import { deepStrictEqual } from 'node:assert';
import { join } from 'node:path';
import Sinon from 'sinon';
import { parse_tag } from '../../../src/utils/shortcode.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/shortcode/parse_tag', () => {
    it('empty', () => {
        const content = '';
        const result = parse_tag(content);
        deepStrictEqual(result, undefined);
    });
    it('only tag', () => {
        const content = 'tag';
        const result = parse_tag(content);
        deepStrictEqual(result, { tag: 'tag' });
    });
    it('tag and bool attribute', () => {
        const content = 'tag key';
        const result = parse_tag(content);
        deepStrictEqual(result, {
            tag: 'tag',
            attributes: {
                key: true,
            },
        });
    });
    it('tag and text attribute', () => {
        const content = 'tag key="value"';
        const result = parse_tag(content);
        deepStrictEqual(result, {
            tag: 'tag',
            attributes: {
                key: 'value',
            },
        });
    });
    it('tag and text attribute with spaces', () => {
        const content = 'tag key="value here"';
        const result = parse_tag(content);
        deepStrictEqual(result, {
            tag: 'tag',
            attributes: {
                key: 'value here',
            },
        });
    });
    it('tag and multiple attributes', () => {
        const content = 'tag bool key="value" lorem="ipsum dolor"';
        const result = parse_tag(content);
        deepStrictEqual(result, {
            tag: 'tag',
            attributes: {
                bool: true,
                key: 'value',
                lorem: 'ipsum dolor',
            },
        });
    });
    it('tag and attribute without quotes', () => {
        const content = 'tag key=value';
        const result = parse_tag(content);
        deepStrictEqual(result, {
            tag: 'tag',
            attributes: {
                key: 'value',
            },
        });
    });
    it('tag and multiple attributes without quotes', () => {
        const content = 'tag bool key=value lorem=ipsum';
        const result = parse_tag(content);
        deepStrictEqual(result, {
            tag: 'tag',
            attributes: {
                bool: true,
                key: 'value',
                lorem: 'ipsum',
            },
        });
    });
    it('tag and multiple attributes with and without quotes', () => {
        const content = 'tag bool key=value lorem="ipsum dolor"';
        const result = parse_tag(content);
        deepStrictEqual(result, {
            tag: 'tag',
            attributes: {
                bool: true,
                key: 'value',
                lorem: 'ipsum dolor',
            },
        });
    });
    it('tag with = in value', () => {
        const content = `tag key="value = 'yeah'"`;
        const result = parse_tag(content);
        deepStrictEqual(result, {
            tag: 'tag',
            attributes: {
                key: "value = 'yeah'",
            },
        });
    });
});
