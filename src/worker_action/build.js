import { compile_server_svelte } from '../utils/compile.js';
import { read_json } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { generate_page_code } from '../utils/generate.js';
import { filled_array, } from '../utils/validate.js';
import { render_server_compiled_svelte } from '../utils/compile_svelte.js';

export async function build(files) {
    if (!filled_array(files)) {
        return;
    }

    for (const file of files) {
        Logger.info(file);
        const data = read_json(file);
        const content = generate_page_code(data);
        const exec_result = await compile_server_svelte(content, file);

        const rendered_result = await render_server_compiled_svelte(exec_result, data, file);
        // if(rendered_result?.result) {
        //     Logger.info(file, rendered_result.result);
        // }

        // Logger.info('result', result);
    }
}
