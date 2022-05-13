import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { exists, read, to_extension } from './file.js';
import { filled_string, is_null } from './validate.js';

const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url), '..')));

export function replace_import_path(content) {
    if (!filled_string(content)) {
        return '';
    }
    return content.replace(/(import .*? from ')@lib/g, '$1' + __dirname);
}

export function combine_splits(path, content) {
    const result = {
        path: is_null(path) ? '' : path,
        content: '',
        css: undefined,
        js: undefined,
    };
    if (!filled_string(content)) {
        content = '';
    }
    if (!filled_string(path)) {
        result.content = content;
        return result;
    }
    // load css
    const css = to_extension(path, 'css');
    if (exists(css)) {
        const css_content = read(css);
        content = `${content}<style>${css_content}</style>`;
        result.css = css;
    }
    
    // load js
    const js = to_extension(path, 'js');
    if (exists(js)) {
        const js_content = read(js);
        content = `<script>${js_content}</script>${content}`;
        result.js = js;
    }

    result.content = content;
    return result;
}
