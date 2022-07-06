import esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { join } from 'path';
import { FOLDER_CLIENT, FOLDER_GEN_TEMP } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { insert_import } from './compile.js';
import { get_error_message } from './error.js';
import { read, remove, write } from './file.js';
import { Logger } from './logger.js';
import { uniq_id } from './uniq.js';
import { filled_string } from './validate.js';

export async function build(content, file) {
    if (!filled_string(content) || !filled_string(content)) {
        return { code: undefined, sourcemap: undefined };
    }
    const tmp_file = join(Cwd.get(), FOLDER_GEN_TEMP, `${uniq_id()}.js`);
    let code;
    write(tmp_file, content);
    try {
        await esbuild.build({
            entryPoints: [tmp_file],
            outfile: tmp_file,
            allowOverwrite: true,
            sourcemap: true,
            minify: Env.is_prod(),
            format: 'iife',
            bundle: true,
            platform: 'browser',
            treeShaking: true,
            logLevel: 'silent',
            plugins: [
                sveltePlugin({
                    compilerOptions: { css: true },
                    filterWarnings: (warning) => {
                        // ignore some warnings
                        if (warning.code == 'css-unused-selector' && warning.message.indexOf('[data-slot=') > -1) {
                            return false;
                        }
                        Logger.warning(get_error_message(warning, file, 'svelte'));
                        return false;
                    }
                }),
            ],
        });
        code = insert_import(read(tmp_file), file, FOLDER_CLIENT);
        code = code.replace(/\/\/# sourceMappingURL=[^.]+\.js\.map/g, '// %sourcemap%');
    } catch (e) {
        Logger.error(get_error_message(e, file, 'build'));
    }
    remove(tmp_file);
    const tmp_sourcemap = tmp_file + '.map';
    const sourcemap = read(tmp_sourcemap);

    remove(tmp_sourcemap);
    return { code, sourcemap };
}
