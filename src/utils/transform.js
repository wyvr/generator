import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { filled_string } from './validate.js';

const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url), '..')));

export function replace_import_path(content) {
    if (!filled_string(content)) {
        return '';
    }
    return content.replace(/(import .*? from ')@lib/g, '$1' + __dirname);
}
