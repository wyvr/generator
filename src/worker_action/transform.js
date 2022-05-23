// import { Config } from '../utils/config.js';
import { extname } from 'path';
import { insert_import } from '../utils/compile.js';
import { read, remove, write } from '../utils/file.js';
// import { Logger } from '../utils/logger.js';
import { combine_splits } from '../utils/transform.js';
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
            continue;
        }
        // replace import in text files
        if (['.js', '.ts', '.css', '.scss'].indexOf(extension) > -1) {
            write(file, insert_import(content, file));
        }
    }
    // await new Promise(r => setTimeout(r, 2000));
    return true;
}
