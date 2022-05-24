// import { Config } from '../utils/config.js';
import { extname } from 'path';
import { read, remove, write } from '../utils/file.js';
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
        let content = read(file);
        if (extension == '.svelte') {
            const combined = await combine_splits(file, content);
            if (filled_string(combined.content)) {
                content = combined.content;
            }
            remove(combined.css);
            remove(combined.js);

            // override the content
            write(file, content);

            
            // generate server file
            write(to_server_path(file), replace_wyvr_magic(content, false));
            
            // generate client file
            write(to_client_path(file), replace_wyvr_magic(content, true));
            return;
        }
        // static files
    }
    // await new Promise(r => setTimeout(r, 2000));
    return true;
}
