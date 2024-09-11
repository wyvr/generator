import { join } from 'node:path';
import { FOLDER_GEN } from '../constants/folder.js';
import { exists, find_file, is_file, read, write } from '../utils/file.js';
import { cpSync } from 'node:fs';

export function modify_svelte() {
    // make the svelte/internal file asynchronous to allow onServer and onRequest to be executed correctly
    const internal_file = find_file('.', ['node_modules/svelte/src/runtime/internal/index.js', 'node_modules/@wyvr/generator/node_modules/svelte/src/runtime/internal/index.js']);
    if (!is_file(internal_file)) {
        throw new Error('svelte is not installed');
    }
    const internal_path = `${join(FOLDER_GEN, 'svelte')}/`;
    if (!exists(internal_path)) {
        copy_svelte(internal_file.replace('/src/runtime/internal/index.js', ''), internal_path);
        const ssr_path = join(internal_path, 'src/runtime/internal/ssr.js');
        const ssr_content = read(ssr_path);
        write(ssr_path, modify_svelte_internal(ssr_content));
    }
}

export function copy_svelte(from, to) {
    cpSync(from, to, {
        recursive: true
    });
}

export function modify_svelte_internal(content) {
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
        if (lines[j] === '}') {
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
        if (lines[j] === '}') {
            return j;
        }
    }

    return i;
}

function replace_function(line) {
    return line.replace('function', 'async function');
}
