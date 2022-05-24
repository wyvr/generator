// import { Config } from '../utils/config.js';
import { extname } from 'path';
import { insert_import } from '../utils/compile.js';
import { read, symlink, write } from '../utils/file.js';
import { to_client_path, to_server_path } from '../utils/to.js';
// import { Logger } from '../utils/logger.js';
import { combine_splits, replace_wyvr_magic } from '../utils/transform.js';
import { filled_array, filled_string } from '../utils/validate.js';
// import { match_interface } from '../utils/validate.js';
// import { Cwd } from '../vars/cwd.js';
// import { Env } from '../vars/env.js';
// import { ReleasePath } from '../vars/release_path.js';
// import { Report } from '../vars/report.js';
// import { UniqId } from '../vars/uniq_id.js';
// import { WyvrPath } from '../vars/wyvr_path.js';

export async function transform(files) {
    if (!filled_array(files)) {
        return false;
    }
    for (const file of files) {
        const extension = extname(file);
        const server_file = to_server_path(file);
        const client_file = to_client_path(file);
        if (extension == '.svelte') {
            let content = read(file);
            const combined = await combine_splits(file, content);
            if (filled_string(combined.content)) {
                content = combined.content;
            }
            
            // override the content
            write(file, content);
            
            // generate server file
            write(server_file, replace_wyvr_magic(content, false));
            
            // generate client file
            write(client_file, replace_wyvr_magic(content, true));
            
            continue;
        }
        // replace import in text files
        if (['.js', '.ts', '.css', '.scss'].indexOf(extension) > -1) {
            const expanded_content = insert_import(read(file), file);
            write(file, expanded_content);
        }
        // link static files
        symlink(file, server_file);
        symlink(file, client_file);
    }
    return true;
}
