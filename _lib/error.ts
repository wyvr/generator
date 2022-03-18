import { Logger } from '@lib/logger';
import { join } from 'path';
import { Cwd } from '@lib/vars/cwd';
import { IObject } from '@lib/interface/object';

export class Error {
    static extract(e: IObject, source: string) {
        const root_dir = Cwd.get();
        const object = {
            code: null,
            filename: null,
            hint: null,
            message: null,
            name: e.name || null,
            source: null,
            stack: null,
            debug: e.stack
        };
        if (source) {
            object.source = source.replace(root_dir + '/', '');
        }
        // sass error
        if (e.file) {
            object.filename = e.file;
        }
        const gen_dir = join(root_dir, 'gen');
        let stack = null;
        if (e.stack) {
            stack = e.stack.split('\n');
        }
        if (stack) {
            const shrinked_stack = stack
                .map((entry) => {
                    // when line starts with "- <cwd>/gen"
                    const match = entry.match(/^- (.*?\/gen\/.*)$/);
                    if (match) {
                        return match[1].replace(gen_dir + '/', '');
                    }
                    // when line contains " at /" and the "<cwd>/gen"
                    if (entry.indexOf(gen_dir) > -1 && entry.indexOf(' at ') > -1) {
                        return entry.replace(/.*?at /, '').replace(gen_dir + '/', '');
                    }

                    return null;
                })
                .filter((x) => x);
            if(shrinked_stack.length > 0) {
                object.stack = shrinked_stack;
                // svelte errors
                if (stack.length > 4 && stack[0].indexOf(gen_dir) > -1 && stack[2].indexOf('^') > -1 && stack[3].trim() == '') {
                    object.stack = [stack[0].trim().replace(gen_dir + '/', '')];
                    object.hint = stack.slice(1, 3).join('\n');
                }
            }
        }
        if (e.message) {
            const splitted_message = e.message.split('\n');
            object.message = splitted_message.shift();
        }
        // sass error
        if (e.formatted) {
            object.stack = e.formatted.split('\n');
        }
        // svelte frame
        if (e.frame) {
            object.stack = e.frame.split('\n');
        }
        // when stack is empty
        if(!Array.isArray(object.stack)) {
            object.stack = [];
        }

        return object;
    }
    static get(e: IObject, filename: string, scope: string = null): string {
        const data = this.extract(e, filename);
        const result = [];
        if (scope) {
            result.push(Logger.color.bold('@' + scope));
        }
        result.push(`[${Logger.color.bold(data.name)}] ${data.message ?? '-'}`);
        if (Array.isArray(data.stack)) {
            result.push(Logger.color.dim('stack'));
            result.push(...data.stack.map((entry) => `${Logger.color.dim('-')} ${entry}`));
        }
        if (data.source) {
            result.push(`${Logger.color.dim('source')} ${data.source}`);
        }

        return result.join('\n');
    }
}