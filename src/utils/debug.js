import { extname, join } from 'path';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { read, to_extension, write_json } from './file.js';
import { to_dirname } from './to.js';
import { filled_string } from './validate.js';

export function add_debug_code(html, path, data) {
    if (!filled_string(html) || !filled_string(path)) {
        return '';
    }
    const extension = extname(path);
    if (Env.is_prod() || !extension.match(/^\.(?:html|htm|php)$/)) {
        return html;
    }
    // add debug data
    const data_path = to_extension(path, 'json');
    write_json(data_path, data);
    const debug_code_content = read(join(to_dirname(import.meta.url), '..', 'resource', 'debug_code.html'));
    return html.replace(
        /<\/body>/,
        debug_code_content
            .replace(/\{release_path\}/g, data_path.replace(ReleasePath.get(), ''))
            .replace(/\{shortcode_path\}/g, path.replace(ReleasePath.get(), ''))
            .replace(/\{identifier\}/g, data._wyvr?.identifier) + '</body>'
    );
}
