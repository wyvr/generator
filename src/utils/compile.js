import * as sass from 'sass';
import esbuild from 'esbuild';
import { marked } from 'marked';
import fm from 'front-matter';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { filled_string, is_null, is_object } from './validate.js';
import { exists, read } from './file.js';
import { extname, join, sep } from 'node:path';
import { replace_src_path } from './transform.js';
import { compile_server_svelte_from_code, execute_server_compiled_svelte } from './compile_svelte.js';
import { FOLDER_GEN, FOLDER_SRC } from '../constants/folder.js';
import { gfmHeadingId } from 'marked-gfm-heading-id';

/**
 * replace @import in content
 * @param {string} content
 * @param {string} file
 * @returns replaced content
 */
export function insert_import(content, file, to) {
    if (!filled_string(content)) {
        return '';
    }
    if (!filled_string(to)) {
        to = FOLDER_SRC;
    }
    // @NOTE this will also work in non css context
    return replace_src_path(content, join(FOLDER_GEN, to)).replace(/@import ['"](\/[^"']*)['"];/g, (match, path) => {
        // @NOTE scss has another syntax e.g. folder/file => folder/_file.scss
        if (!extname(path)) {
            const splits = path.split(sep);
            const try_file = splits.pop();
            path = `${splits.join(sep)}${sep}_${try_file}.scss`;
        }
        if (!exists(path)) {
            Logger.warning(get_error_message({ message: `can not import ${path} into ${file}, maybe the file doesn't exist` }, file, 'import'));
            return '';
        }
        let import_content = read(path);

        if (is_null(import_content)) {
            return '';
        }
        import_content = import_content.replace(/\n/g, ' ');
        // handle deep importing
        if (import_content.indexOf('@import') > -1) {
            return insert_import(import_content, path);
        }
        return import_content;
    });
}
export async function compile_sass(code, file) {
    if (!filled_string(code)) {
        return undefined;
    }
    try {
        const compiled_sass = await sass.compileStringAsync(insert_import(code, file));
        return compiled_sass?.css;
    } catch (e) {
        Logger.error(get_error_message(e, file, 'sass'));
        return undefined;
    }
}
export async function compile_typescript(code, file) {
    if (!filled_string(code)) {
        return undefined;
    }
    try {
        const compiled_typescript = await esbuild.transform(code, {
            loader: 'ts'
        });
        return compiled_typescript?.code;
    } catch (e) {
        Logger.error(get_error_message(e, file, 'typescript'));
        return undefined;
    }
}
export function compile_markdown(code) {
    if (!filled_string(code)) {
        return undefined;
    }
    let data,
        front_matter = fm(code);
    if (is_object(front_matter.attributes)) {
        data = front_matter.attributes;
    }
    marked.use(gfmHeadingId({}));
    const content = marked(front_matter.body, {
        mangle: false,
        headerIds: false,
        breaks: false
    }).replace(/<code[^>]*>[\s\S]*?<\/code>/g, (match) => {
        // replace svelte placeholder inside code blocks
        const replaced = match.replace(/\{/g, '&lbrace;').replace(/\}/g, '&rbrace;');
        return replaced;
    });
    return {
        content,
        data
    };
}
export async function compile_server_svelte(content, file) {
    if (!filled_string(content) || !filled_string(file)) {
        return undefined;
    }
    const compiled = await compile_server_svelte_from_code(content, file);
    const component = await execute_server_compiled_svelte(compiled, file);
    if (is_null(compiled) || is_null(component)) {
        return undefined;
    }
    return { compiled, component, result: undefined };
}
