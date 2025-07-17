import { join } from 'node:path';
import { FOLDER_GEN } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { Logger } from './logger.js';
import { filled_array, filled_string, is_null, is_object } from './validate.js';
import { Event } from './event.js';
import { PROJECT_EVENT, PROJECT_EVENT_ERROR } from '../constants/project_events.js';
import { read } from './file.js';
import { to_dirname, to_html_entities } from './to.js';
import { inject_csp } from '../model/csp.js';
import { inject_events, inject_script } from './build.js';
import { Env } from '../vars/env.js';

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
        debug: e.stack
    };
    if (filled_string(source)) {
        object.source = source.replace(`${root_dir}/`, '');
    }
    // sass error
    if (e.file) {
        object.filename = e.file;
    }
    const gen_dir = join(root_dir, FOLDER_GEN);
    const gen_dir_path = `${gen_dir}/`;
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
                    return match[1].replace(gen_dir_path, '');
                }
                // when line contains " at /" and the "<cwd>/gen"
                if (entry.indexOf(gen_dir) > -1 && entry.indexOf(' at ') > -1) {
                    return entry.replace(/.*?at (?:file:\/\/)?/, '').replace(gen_dir_path, '');
                }
                // sass errors can contain "│" (no pipe) at the beginning add them too
                if (entry.indexOf('│') > -1 || entry.indexOf('╷') > -1 || entry.indexOf('╵') > -1) {
                    return entry;
                }
                // ts errors can contain "<stdin>" at the beginning add them too
                if (entry.indexOf('<stdin>:') > -1) {
                    return entry.replace(/^<stdin>:/, '');
                }

                return null;
            })
            .filter((x) => x);
        if (shrinked_stack.length > 0) {
            object.stack = shrinked_stack;
            // svelte errors
            if (stack.length > 4 && stack[0].indexOf(gen_dir) > -1 && stack[2].indexOf('^') > -1 && stack[3].trim() === '') {
                object.stack = [stack[0].trim().replace(gen_dir_path, '')];
                object.hint = stack.slice(1, 3).join('\n');
            }
        }
    }
    if (e.message) {
        object.message = e.message;
    }
    // fetch errors
    if (e.cause?.reason) {
        object.message = `${object.message || ''}\n${e.cause.reason}`;
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
    // esbuild errors
    if (filled_array(e.errors)) {
        object.message = `\n${e.errors
            .map((error) => {
                let text = `- ${error.text}`;
                const has_location = error.location && !is_null(error.location.line) && !is_null(error.location.column);
                let where = error.location?.file ? `\n${error.location.file.replace(/\?.*$/, '').replace(/^gen\/[^/]+\//, '$src/')}` : '';

                if (has_location) {
                    where += ` @ ${error.location.line}:${error.location.column}`;
                }

                let preview = '';

                if (has_location) {
                    if (!is_null(error.location.lineText)) {
                        const before = error.location.lineText.substring(0, error.location.column);
                        const highlight = error.location.lineText.substring(error.location.column, error.location.column + error.location.length);
                        const after = error.location.lineText.substring(error.location.column + error.location.length);
                        preview = `${error.location.line} | `;
                        const preLength = preview.length;
                        preview += `${Logger.color.dim(before)}${Logger.color.bold(highlight)}${Logger.color.dim(after)}\n${' '.repeat(
                            preLength + error.location.column
                        )}${'^'.repeat(error.location.length)}`;
                        preview = `\n\n${preview}`;
                    }
                }
                text += where + preview;
                if (!is_null(error.notes)) {
                    text += `\n\n${error.notes
                        .map((n) => n.text)
                        .filter((x) => x)
                        .join('\n')}`;
                }
                return text;
            })
            .join('\n')}`;
    }

    return object;
}

export function get_error_message(e, filename, scope) {
    const data = extract_error(e, filename);
    const result = [];
    if (scope) {
        result.push(Logger.color.bold(`@${scope}`));
    }
    const message = `${data.name ? `[${Logger.color.bold(data.name)}] ` : ''}${data.message ?? '-'}`;
    result.push(message);
    if (filled_array(data.stack)) {
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

    if (messages[0] !== '[svelte]') {
        return messages;
    }

    messages[0] = Logger.color.dim(messages[0]);

    return messages.map((message) => {
        if (is_null(message) || !is_object(message)) {
            return message;
        }
        // ssr errors
        if (message.code === 'parse-error' && message.frame && message.start && message.name) {
            return `\n${message.name} ${Logger.color.dim('Line:')}${message.start.line}${Logger.color.dim(' Col:')}${message.start.column}\n${message.frame}`;
        }
        // rollup errors
        if (message.code === 'PARSE_ERROR' && message.frame && message.loc) {
            return `\n${message.code} ${Logger.color.dim('in')} ${message.loc.file}\n${Logger.color.dim('Line:')}${message.loc.line}${Logger.color.dim(' Col:')}${
                message.loc.column
            }\n${message.frame}`;
        }
        // nodejs error
        if (message.error) {
            return get_error_message(message.error, message.filename);
        }
        return message;
    });
}

/**
 * Detect global error events
 */
export function bind_error_events() {
    // @see https://nodejs.org/api/process.html#event-uncaughtexception
    process.on('uncaughtException', (error, origin) => {
        Event.emit(PROJECT_EVENT, PROJECT_EVENT_ERROR, { error, origin });
    });
    // when available it prevents the exit of the application
    process.on('unhandledRejection', (reason, promise) => {
        Event.emit(PROJECT_EVENT, PROJECT_EVENT_ERROR, { promise, reason });
    });
}

/**
 * Generate a error page
 */
export function get_error_page(error, file, context = 'error') {
    if (Env.is_prod()) {
        return '<h1>Internal Server Error</h1>';
    }
    const error_data = extract_error(error, file);
    if (!error_data) {
        Logger.error('error in generating the error page, when extracting the error', file);
        return '<h1>Internal Server Error</h1>';
    }
    try {
        const resource_dir = join(to_dirname(import.meta.url), '..', 'resource');
        const debug_code_content = read(join(resource_dir, 'devtools_code.js'))
            .replace(/\{identifier\}/g, '')
            .replace(/\{shortcode\}/g, '');

        const socket_helpers = read(join(resource_dir, 'client_helpers.js'));
        const socket_content = read(join(resource_dir, 'client_socket.js'));

        let stack = error_data.debug;
        if (filled_array(error_data.stack)) {
            stack = error_data.stack.join('\n');
        }

        const content = read(join(resource_dir, '500.html'))
            ?.replace(/\{message\}/g, error_data.message)
            ?.replace(/\{context\}/g, context)
            .replace(
                /\{stack\}/g,
                to_html_entities(stack)
                    .split('\n')
                    .map((line, index) => `<div class="line${index + 1}">${line}</div>`)
                    .join('')
            )
            .replace(/\{name\}/g, error_data.name)
            .replace(/\{file\}/g, file)
            .replace(/\{hint\}/g, error_data.hint ?? '');
        return inject_csp(inject_events(inject_script(content, [debug_code_content, socket_helpers, socket_content])));
    } catch (e) {
        Logger.error('error in generating the error page', extract_error(e, file));
        return '<h1>Internal Server Error</h1>';
    }
}
