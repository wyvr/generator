import { extname } from 'node:path';
import { WyvrFile } from '../model/wyvr_file.js';
import { WyvrFileRender } from '../struc/wyvr_file.js';
import { compile_client_svelte_from_code, compile_server_svelte_from_code } from '../utils/compile_svelte.js';
import { get_error_message } from '../utils/error.js';
import { exists, read, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { to_client_path, to_relative_path_of_gen, to_server_path } from '../utils/to.js';
import { insert_hydrate_tag, remove_on_server, replace_wyvr_magic } from '../utils/transform.js';
import { filled_array } from '../utils/validate.js';
import { Dependency } from '../model/dependency.js';

export async function compile(files) {
    if (!filled_array(files)) {
        return false;
    }
    const dep_db = new Dependency();
    // const file_config = get_config_cache('dependencies.config');
    for (const file of files) {
        if (!exists(file) || extname(file) !== '.svelte') {
            continue;
        }
        try {
            const content = read(file);
            // generate server file
            const server_file = to_server_path(file);
            let server_code = replace_wyvr_magic(content, false);
            if (server_code) {
                const rel_path = to_relative_path_of_gen(file);
                const entry = WyvrFile(rel_path);
                const dep_entry = dep_db.get_file(rel_path);

                entry.config = dep_entry?.config;
                if (entry?.config?.render === WyvrFileRender.hydrate) {
                    server_code = insert_hydrate_tag(server_code, entry);
                }
                const compiled = await compile_server_svelte_from_code(server_code, file);
                if (compiled?.js?.code) {
                    write(server_file, compiled.js.code);
                }
            }
            if (file.includes('/node_modules/')) {
                continue;
            }
            // generate client file
            const client_file = to_client_path(file);
            const client_code = remove_on_server(replace_wyvr_magic(content, true));
            const prepared_client_content = await compile_client_svelte_from_code(client_code, file);
            write(client_file, prepared_client_content);
        } catch (e) {
            Logger.error(get_error_message(e, file, 'compile'));
        }
    }
    return true;
}
