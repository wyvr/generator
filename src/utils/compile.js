import sass from 'sass';
import esbuild from 'esbuild';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { filled_string } from './validate.js';

export async function compile_sass(code, file) {
    if (!filled_string(code)) {
        return undefined;
    }
    try {
        const compiled_sass = await sass.compileStringAsync(code);
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
