import { compile } from 'svelte/compiler';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { filled_string, is_null, is_path, match_interface } from './validate.js';
import { exists, remove, to_extension, write } from './file.js';
import { dirname, extname, join, resolve } from 'path';
import { Env } from '../vars/env.js';
import { css_hash } from './hash.js';
import { uniq_id } from './uniq.js';
import { Cwd } from '../vars/cwd.js';
import { FOLDER_GEN_SERVER, FOLDER_GEN_SRC, FOLDER_GEN_TEMP } from '../constants/folder.js';
import { search_segment } from './segment.js';
import { replace_src_in_path, replace_src_path } from './transform.js';

export async function compile_server_svelte_from_code(content, file) {
    if (!filled_string(content) || !filled_string(file)) {
        return undefined;
    }
    let result;
    try {
        const modified_content = content.replace(/import (.*?) from ['"]([^'"]+)['"]/g, (match, imported, path) => {
            if (is_path(path)) {
                // correct the path
                path = replace_src_in_path(path, FOLDER_GEN_SERVER).replace(
                    new RegExp(FOLDER_GEN_SRC, 'g'),
                    FOLDER_GEN_SERVER
                );
                // transform to js from svelte
                const ext = extname(path);
                if (ext == '.svelte') {
                    path = to_extension(path, 'js');
                }
                // force file ending when nothing is specified
                if (!ext) {
                    const check_ext = ['.js', '.mjs', '.ts'];
                    const dir = dirname(file);
                    const new_ext = check_ext.find((search_ext) => exists(resolve(dir, `${path}${search_ext}`)));
                    if (!new_ext) {
                        Logger.warning(
                            get_error_message(
                                new Error(
                                    `can't find import ${path} with the extensions ${check_ext.join(',')} in ${file}`
                                ),
                                file,
                                'svelte server compile'
                            )
                        );
                    }
                    path = `${path}${new_ext || ''}`;
                }
            }

            return `import ${imported} from '${path}'`;
        });

        const resourced_content = replace_src_path(modified_content, FOLDER_GEN_SERVER, extname(file));

        // compile svelte
        const compiled = await compile(resourced_content, {
            dev: Env.is_dev(),
            generate: 'ssr',
            format: 'esm',
            immutable: true,
            hydratable: true,
            cssHash: css_hash,
        });
        result = compiled;
    } catch (e) {
        Logger.error(get_error_message(e, file, 'svelte server compile'), e.stack);
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
        Logger.error(get_error_message(e, file, 'svelte server execute'));
    }
    remove(tmp_file);
    return component;
}

export async function render_server_compiled_svelte(exec_result, file) {
    if (!match_interface(exec_result, { compiled: true, component: true, result: true }) || !filled_string(file)) {
        return undefined;
    }
    return undefined;
}
