import { compile } from 'svelte/compiler';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { filled_string, is_null, match_interface } from './validate.js';
import { remove, write } from './file.js';
import { join } from 'path';
import { Env } from '../vars/env.js';
import { css_hash } from './hash.js';
import { uniq_id } from './uniq.js';
import { Cwd } from '../vars/cwd.js';
import { FOLDER_GEN_SERVER, FOLDER_GEN_SRC, FOLDER_GEN_TEMP } from '../constants/folder.js';
import { search_segment } from './segment.js';

export async function compile_server_svelte_from_code(content, file) {
    if (!filled_string(content) || !filled_string(file)) {
        return undefined;
    }
    let result;
    try {
        const modified_content = content.replace(/import .*? from ['"]([^'"]+)['"]/g, (match, path) => {
            match = match.replace(new RegExp(FOLDER_GEN_SRC, 'g'), FOLDER_GEN_SERVER).replace();
            if (path.match(/\.svelte$/)) {
                match = match.replace(/\.svelte(['"])$/, '.js$1');
            }
            return match;
        }); //.replace(new RegExp(FOLDER_GEN_SRC, 'g'), FOLDER_GEN_SERVER).replace();
        // compile svelte
        const compiled = await compile(modified_content, {
            dev: Env.is_dev(),
            generate: 'ssr',
            format: 'esm',
            immutable: true,
            hydratable: true,
            cssHash: css_hash,
        });
        result = compiled;
    } catch (e) {
        Logger.error(get_error_message(e, file, 'svelte server'), e.stack);
    }
    return result;
}

export async function execute_server_compiled_svelte(compiled, file) {
    if (!search_segment(compiled, 'js.code')) {
        Logger.warning("can't execute", file, ' no code found');
        return undefined;
    }

    if (!filled_string(file)) {
        Logger.warning("can't execute code without file");
        return undefined;
    }
    let component;
    const tmp_file = join(Cwd.get(), FOLDER_GEN_TEMP, `${uniq_id()}.js`);
    write(tmp_file, compiled.js.code);
    try {
        component = await import(tmp_file);
        // return default when available
        if (!is_null(component.default)) {
            component = component.default;
        }
    } catch (e) {
        Logger.error(get_error_message(e, file, 'svelte server'));
    }
    remove(tmp_file);
    return component;
}

export async function render_server_compiled_svelte(exec_result, file) {
    if (
        !match_interface(exec_result, { compiled: true, component: true, result: true }) ||
        !filled_string(file)
    ) {
        return undefined;
    }
    return undefined;
}
