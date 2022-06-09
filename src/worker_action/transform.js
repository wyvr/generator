import { extname } from 'path';
import { insert_import } from '../utils/compile.js';
import { exists, read, symlink, write } from '../utils/file.js';
import { to_client_path, to_server_path } from '../utils/to.js';
import { combine_splits } from '../utils/transform.js';
import { filled_array, filled_string } from '../utils/validate.js';

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

            // override the content
            write(file, content);

            continue;
        }
        // replace import in text files
        if (['.js', '.ts', '.css', '.scss'].indexOf(extension) > -1) {
            const expanded_content = insert_import(read(file), file);
            write(file, expanded_content);
        }
        // link static files
        symlink(file, to_server_path(file));
        symlink(file, to_client_path(file));
    }
    return true;
}
