import { join } from 'path';
import { FOLDER_GEN_SERVER } from '../constants/folder.js';
import { exists, find_file, is_file, read, write } from '../utils/file.js';

export async function modify_svelte() {
    // make the svelte/internal file asynchronous to allow onServer to be executed correctly
    const internal_file = find_file('.', [
        'node_modules/svelte/internal/index.mjs',
        'node_modules/@wyvr/generator/node_modules/svelte/internal/index.mjs',
    ]);
    if (!is_file(internal_file)) {
        throw new Error('svelte is not installed');
    }
    const internal_path = join(FOLDER_GEN_SERVER, 'svelte_internal.mjs');
    if (!exists(internal_path)) {
        write(internal_path, await modify_svelte_internal(read(internal_file)));
    }
}

export async function modify_svelte_internal(content) {
    const lines = content.split('\n');
    for (let i = 0, len = lines.length; i < len; i++) {
        i = modify_create_ssr_component(lines, i, len);
        i = modify_each(lines, i, len);
    }

    return lines.join('\n');
}

function modify_create_ssr_component(lines, i, len) {
    // ignore when the function signature does not match
    if (!lines[i].includes('function create_ssr_component')) {
        return i;
    }
    // this is the first line of the function
    lines[i] = replace_function(lines[i]);

    for (let j = i + 1; j < len; j++) {
        if (lines[j].includes('function $$render')) {
            lines[j] = replace_function(lines[j]);
            continue;
        }
        if (lines[j].includes('fn')) {
            lines[j] = lines[j].replace('fn', 'await fn');
            continue;
        }
        if (lines[j].includes('render:')) {
            lines[j] = lines[j].replace('render:', 'render: async');
            continue;
        }
        if (lines[j].includes('$$render(')) {
            lines[j] = lines[j].replace(/(\$\$render\()/, 'await $1');
            continue;
        }
        if (lines[j] == '}') {
            return j;
        }
    }

    return i;
}

function modify_each(lines, i, len) {
    // ignore when the function signature does not match
    if (!lines[i].includes('function each(')) {
        return i;
    }
    // this is the first line of the function
    lines[i] = replace_function(lines[i]);

    for (let j = i + 1; j < len; j++) {
        if (lines[j].includes('fn')) {
            lines[j] = lines[j].replace('fn(', 'await fn(');
            continue;
        }
        if (lines[j] == '}') {
            return j;
        }
    }

    return i;
}

function replace_function(line) {
    return line.replace('function', 'async function');
}
