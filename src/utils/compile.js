import sass from 'sass';
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
    } catch (e) {
        if (!filled_string(file)) {
            Logger.error(get_error_message(e, undefined, 'sass'));
            return undefined;
        }
        Logger.error(get_error_message(e, file, 'sass'));
        return undefined;
    }
}
