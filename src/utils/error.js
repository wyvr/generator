import { join } from 'path';
import { FOLDER_GEN } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { Logger } from './logger.js';
import { filled_array, filled_string, is_null, is_object } from './validate.js';

export function extract_error(e, source) {
    const root_dir = Cwd.get();
    const object = {
        code: undefined,
        filename: undefined,
        hint: undefined,
        message: undefined,
        name: e.name || undefined,
        source: undefined,
        stack: undefined,
        debug: e.stack,
    };
    if (filled_string(source)) {
        object.source = source.replace(root_dir + '/', '');
    }
    // sass error
    if (e.file) {
        object.filename = e.file;
    }
    const gen_dir = join(root_dir, FOLDER_GEN);
    let stack;
    if (e.stack) {
        stack = e.stack.split('\n');
    }
    if (stack) {
        const shrinked_stack = stack
            .map((entry) => {
                // when line starts with "- <cwd>/gen"
                const match = entry.match(/^\s*- (.*?\/gen\/.*)$/);
                if (match) {
                    return match[1].replace(gen_dir + '/', '');
                }
                // when line contains " at /" and the "<cwd>/gen"
                if (entry.indexOf(gen_dir) > -1 && entry.indexOf(' at ') > -1) {
                    return entry.replace(/.*?at (?:file:\/\/)?/, '').replace(gen_dir + '/', '');
                }

                return null;
            })
            .filter((x) => x);
        if (shrinked_stack.length > 0) {
            object.stack = shrinked_stack;
            // svelte errors
            if (
                stack.length > 4 &&
                stack[0].indexOf(gen_dir) > -1 &&
                stack[2].indexOf('^') > -1 &&
                stack[3].trim() == ''
            ) {
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
    if (!Array.isArray(object.stack)) {
        object.stack = [];
    }

    return object;
}

export function get_error_message(e, filename, scope) {
    const data = extract_error(e, filename);
    const result = [];
    if (scope) {
        result.push(Logger.color.bold('@' + scope));
    }
    result.push(`[${data.name ? Logger.color.bold(data.name) : ''}] ${data.message ?? '-'}`);
    if (Array.isArray(data.stack)) {
        result.push(Logger.color.dim('stack'));
        result.push(...data.stack.map((entry) => `${Logger.color.dim('-')} ${entry}`));
    }
    if (data.source) {
        result.push(`${Logger.color.dim('source')} ${data.source}`);
    }

    return result.join('\n');
}

export function inject_worker_message_errors(messages) {
    if (!filled_array(messages)) {
        return [];
    }

    if (messages[0] != '[svelte]') {
        return messages;
    }

    messages[0] = Logger.color.dim(messages[0]);

    return messages.map((message) => {
        if (is_null(message) || !is_object(message)) {
            return message;
        }
        // ssr errors
        if (message.code == 'parse-error' && message.frame && message.start && message.name) {
            return `\n${message.name} ${Logger.color.dim('Line:')}${message.start.line}${Logger.color.dim(' Col:')}${
                message.start.column
            }\n${message.frame}`;
        }
        // rollup errors
        if (message.code == 'PARSE_ERROR' && message.frame && message.loc) {
            return `\n${message.code} ${Logger.color.dim('in')} ${message.loc.file}\n${Logger.color.dim('Line:')}${
                message.loc.line
            }${Logger.color.dim(' Col:')}${message.loc.column}\n${message.frame}`;
        }
        // nodejs error
        if (message.error) {
            return Error.get(message.error, message.filename);
        }
        return message;
    });

    //display svelte errors with better output
    // if (messages.length > 0 && data.messages[0] === '[svelte]') {
    //     data.messages = data.messages.map((message, index) => {
    //         if (index == 0 && typeof message == 'string') {
    //             return Logger.color.dim(message);
    //         }
    //         if (message == null) {
    //             return message;
    //         }
    //         // ssr errors
    //         if (
    //             typeof message == 'object' &&
    //             message.code == 'parse-error' &&
    //             message.frame &&
    //             message.start &&
    //             message.name
    //         ) {
    //             return `\n${message.name} ${Logger.color.dim('Line:')}${
    //                 message.start.line
    //             }${Logger.color.dim(' Col:')}${message.start.column}\n${message.frame}`;
    //         }
    //         // rollup errors
    //         if (
    //             typeof message == 'object' &&
    //             message.code == 'PARSE_ERROR' &&
    //             message.frame &&
    //             message.loc
    //         ) {
    //             return `\n${message.code} ${Logger.color.dim('in')} ${
    //                 message.loc.file
    //             }\n${Logger.color.dim('Line:')}${message.loc.line}${Logger.color.dim(' Col:')}${
    //                 message.loc.column
    //             }\n${message.frame}`;
    //         }
    //         // nodejs error
    //         if (typeof message == 'object' && message.error) {
    //             return Error.get(message.error, message.filename);
    //         }
    //         return message;
    //     });
    // }
}
