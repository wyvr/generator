import { compile_server_svelte } from '../utils/compile.js';
import { read_json, to_index, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { generate_page_code } from '../utils/generate.js';
import { filled_array, } from '../utils/validate.js';
import { render_server_compiled_svelte } from '../utils/compile_svelte.js';
import { ReleasePath } from '../vars/release_path.js';
import { join } from 'path';

export async function build(files) {
    if (!filled_array(files)) {
        return;
    }
    const release_path = ReleasePath.get();

    for (const file of files) {
        Logger.info(file);
        const data = read_json(file);
        const content = generate_page_code(data);
        const exec_result = await compile_server_svelte(content, file);

        const rendered_result = await render_server_compiled_svelte(exec_result, data, file);
        const path = join(release_path, to_index(data.url, data._wyvr.extension))
        if(rendered_result?.result) {
            // Logger.info(file, data.url, data._wyvr.extension, to_index(data.url, data._wyvr.extension));
            // Logger.info(file, rendered_result.result);
            write(path, rendered_result.result.html);
        }

    }
}
