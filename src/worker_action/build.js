import { compile_server_svelte } from '../utils/compile.js';
import { read_json } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { generate_page_code } from '../utils/generate.js';
import { filled_array, } from '../utils/validate.js';

export async function build(files) {
    if (!filled_array(files)) {
        return;
    }

    for (const file of files) {
        Logger.info(file);
        const data = read_json(file);
        const content = generate_page_code(data);
        const result = await compile_server_svelte(content, file);
        Logger.info(result);
    }
}
