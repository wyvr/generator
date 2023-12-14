import { extname } from 'path';
import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { extract_wyvr_file_config } from '../model/wyvr_file.js';
import { WorkerAction } from '../struc/worker_action.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { compile_typescript, insert_import } from '../utils/compile.js';
import { get_error_message } from '../utils/error.js';
import { exists, read, write, symlink } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import {
    to_client_path,
    to_relative_path_of_gen,
    to_server_path,
} from '../utils/to.js';
import {
    combine_splits,
    replace_imports,
    replace_wyvr_magic,
} from '../utils/transform.js';
import { filled_array, filled_string, in_array } from '../utils/validate.js';
import { send_action } from '../worker/communication.js';
import { add_dev_note } from '../utils/devtools.js';

export async function transform(files) {
    if (!filled_array(files)) {
        return false;
    }

    for (let file of files) {
        if (!exists(file)) {
            continue;
        }
        try {
            const extension = extname(file);
            if (extension == '.svelte') {
                let content = read(file);
                const combined = await combine_splits(file, content);
                if (!filled_string(combined.content)) {
                    continue;
                }
                content = combined.content;

                // extract wyvr file config and send the data
                const dependency_emit = {
                    type: WorkerEmit.wyvr_config,
                    file: to_relative_path_of_gen(file),
                    config: extract_wyvr_file_config(content),
                };
                send_action(WorkerAction.emit, dependency_emit);

                // override the content
                // const wyvr_details = search_wyvr_content(content);
                write(
                    file,
                    add_dev_note(to_relative_path_of_gen(file), content)
                );

                continue;
            }
            // replace import in text files
            if (
                in_array(
                    ['.mjs', '.cjs', '.js', '.ts', '.css', '.scss'],
                    extension
                )
            ) {
                let content = read(file);
                // compile typescript and change output file
                if (extension == '.ts') {
                    const ts_content = await compile_typescript(content, file);

                    if (ts_content) {
                        content = ts_content;
                        file = file.replace('.ts', '.js');
                    }
                }
                // replace @src in source files
                if (in_array(['.mjs', '.cjs', '.js', '.ts'], extension)) {
                    content = replace_imports(
                        content,
                        file,
                        FOLDER_GEN_SRC,
                        'transform'
                    );
                }
                const expanded_content = add_dev_note(
                    to_relative_path_of_gen(file),
                    insert_import(content, file)
                );
                write(file, expanded_content);

                // write client and server versions of scripts
                if (in_array(['.mjs', '.cjs', '.js', '.ts'], extension)) {
                    write(
                        to_server_path(file),
                        replace_wyvr_magic(expanded_content, false)
                    );
                    write(
                        to_client_path(file),
                        replace_wyvr_magic(expanded_content, true)
                    );
                    continue;
                }
            }

            // link static files
            symlink(file, to_server_path(file));
            symlink(file, to_client_path(file));
        } catch (e) {
            Logger.error(get_error_message(e, file, 'transform'));
        }
    }
    return true;
}
