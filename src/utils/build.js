import esbuild from 'esbuild';
import { join } from 'path';
import { FOLDER_GEN_TEMP } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { get_error_message } from './error.js';
import { read, remove, write } from './file.js';
import { Logger } from './logger.js';
import { uniq_id } from './uniq.js';

export async function build(content, file) {
    const tmp_file = join(Cwd.get(), FOLDER_GEN_TEMP, `${uniq_id()}.js`);
    let result = undefined;
    write(tmp_file, content);
    try {
        await esbuild.build({
            entryPoints: [tmp_file],
            outfile: tmp_file,
            allowOverwrite: true,
            sourcemap: true,
            minify: Env.is_prod(),
            format: 'esm',
            bundle: true,
            platform: 'node',
            target: ['node16'],
        });
        result = read(tmp_file);
    } catch (e) {
        Logger.error(get_error_message(e, file, 'build'));
    }
    remove(tmp_file);
    return result;
}
