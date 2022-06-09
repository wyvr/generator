import { extname } from 'path';
import { compile_server_svelte_from_code } from '../utils/compile_svelte.js';
import { exists, read, write } from '../utils/file.js';
import { to_client_path, to_server_path } from '../utils/to.js';
import { replace_wyvr_magic } from '../utils/transform.js';
import { filled_array } from '../utils/validate.js';

export async function compile(files) {
    if (!filled_array(files)) {
        return false;
    }
    for (const file of files) {
        if (!exists(file) || extname(file) != '.svelte') {
            continue;
        }
        const content = read(file);
        const server_file = to_server_path(file);
        const client_file = to_client_path(file);
        // generate server file
        const server_code = replace_wyvr_magic(content, false);
        if (server_code) {
            const compiled = await compile_server_svelte_from_code(server_code, file);
            if (compiled?.js?.code) {
                write(server_file, compiled.js.code);
            }
        }

        // generate client file
        write(client_file, replace_wyvr_magic(content, true));
    }
    return true;
}
