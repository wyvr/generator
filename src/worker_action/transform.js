import { extname } from 'path';
import { extract_wyvr_file_config } from '../model/wyvr_file.js';
import { WorkerAction } from '../struc/worker_action.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { insert_import } from '../utils/compile.js';
import { exists, read, symlink, write } from '../utils/file.js';
import { to_client_path, to_relative_path, to_server_path } from '../utils/to.js';
import { combine_splits } from '../utils/transform.js';
import { filled_array, filled_string, in_array } from '../utils/validate.js';
import { send_action } from '../worker/communication.js';

export async function transform(files) {
    if (!filled_array(files)) {
        return false;
    }
    for (const file of files) {
        if (!exists(file)) {
            continue;
        }
        const extension = extname(file);
        if (extension == '.svelte') {
            let content = read(file);
            const combined = await combine_splits(file, content);
            if (filled_string(combined.content)) {
                content = combined.content;
            }

            // extract wyvr file config and send the data
            const dependency_emit = {
                type: WorkerEmit.wyvr_config,
                file: to_relative_path(file),
                config: extract_wyvr_file_config(content),
            };
            send_action(WorkerAction.emit, dependency_emit);

            // override the content
            write(file, content);

            continue;
        }
        // replace import in text files
        if (in_array(['.js', '.ts', '.css', '.scss'], extension)) {
            const expanded_content = insert_import(read(file), file);
            write(file, expanded_content);
        }
        // link static files
        symlink(file, to_server_path(file));
        symlink(file, to_client_path(file));
    }
    return true;
}
