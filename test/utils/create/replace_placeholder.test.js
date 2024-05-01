import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { replace_placeholder } from '../../../src/utils/create.js';

describe('utils/create/replace_placeholder', () => {
    it('should return same content if replaces is not an object', () => {
        const content = 'Hello {{ name }}';
        const replaces = 'notAnObject';
        const result = replace_placeholder(content, replaces);
        strictEqual(result, content);
    });

    it('should replace placeholder with corresponding value in replaces object', () => {
        const content = 'Hello {{   name    }}';
        const replaces = { name: 'John' };
        const result = replace_placeholder(content, replaces);
        strictEqual(result, 'Hello John');
    });
    
    it('should replace placeholder with corresponding value in replaces object without spaces', () => {
        const content = 'Hello {{name}}';
        const replaces = { name: 'John' };
        const result = replace_placeholder(content, replaces);
        strictEqual(result, 'Hello John');
    });
    
    it('should replace falsy values with empty string', () => {
        const content = 'Hello {{name}}';
        const replaces = { name: undefined };
        const result = replace_placeholder(content, replaces);
        strictEqual(result, 'Hello ');
    });

    it('should remove placeholder if no corresponding key exists in replaces object', () => {
        const content = 'Hello {{ name }}';
        const replaces = { otherKey: 'John' };
        const result = replace_placeholder(content, replaces);
        strictEqual(result, 'Hello {{ name }}');
    });
});
