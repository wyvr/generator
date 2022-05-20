import sass from 'sass';
import esbuild from 'esbuild';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { filled_string, is_null } from './validate.js';
import { exists, read } from './file.js';
import { extname, sep } from 'path';
import { replace_src_path } from './transform.js';

/**
 * replace @import in content
 * @param {string} content
 * @param {string} file
 * @returns replaced content
 */
export function insert_import(content, file) {
    if (!filled_string(content)) {
        return '';
    }
    // @NOTE this will also work in non css context
    return replace_src_path(content, 'gen/src').replace(/@import ['"](\/[^"']*)['"];/g, (match, path) => {
        // @NOTE scss has another syntax e.g. folder/file => folder/_file.scss
        if (!extname(path)) {
            const splits = path.split(sep);
            const try_file = splits.pop();
            path = `${splits.join(sep)}${sep}_${try_file}.scss`;
        }
        if(!exists(path)) {
            Logger.warning(
                get_error_message(
                    { message: `can not import ${path} into ${file}, maybe the file doesn't exist` },
                    file,
                    'import'
                )
            );
            return '';
        }
        let import_content = read(path);
        
        if (is_null(import_content)) {
            return '';
        }
        // handle deep importing
        if(import_content.indexOf('@import') > -1) {
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
        if (compiled_sass && compiled_sass.css) {
            return compiled_sass.css;
        }
        return undefined;
    } catch (e) {
        if (!filled_string(file)) {
            Logger.error(get_error_message(e, undefined, 'sass'));
            return undefined;
        }
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
            loader: 'ts',
        });
        if (compiled_typescript && compiled_typescript.code) {
            return compiled_typescript.code;
        }

        return undefined;
    } catch (e) {
        if (!filled_string(file)) {
            Logger.error(get_error_message(e, undefined, 'typescript'));
            return undefined;
        }
        Logger.error(get_error_message(e, file, 'typescript'));
        return undefined;
    }
}
