import { join } from 'path';
import { collect_files, copy, exists } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { filled_array, filled_string } from '../utils/validate.js';

export function copy_files(files, to, before) {
    if (filled_array(files) && filled_string(to)) {
        const beforeFn = typeof before == 'function' ? before : () => {};
        files.forEach((file) => {
            if (file.src && file.target && exists(file.src)) {
                // join paths
                const target = join(to, file.target);
                beforeFn(file);
                Logger.debug('copy', file.src, 'to', target);
                copy(file.src, target);
            }
        });
        return true;
    }
    return false;
}

export function copy_folder(source, folder, to, before) {
    if (filled_array(folder) && filled_string(source) && filled_string(to)) {
        folder.forEach((part) => {
            const folder_path = join(source, part);
            if (exists(folder_path)) {
                const files = collect_files(folder_path).map((file) => {
                    return { src: file, target: file.replace(source, '.') };
                });
                copy_files(files, to, before);
            }
        });
        return true;
    }
    return false;
}
