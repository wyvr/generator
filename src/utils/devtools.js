import { extname, join } from 'path';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { read, to_extension, write_json } from './file.js';
import { to_dirname } from './to.js';
import { filled_string } from './validate.js';
import { get_config_cache } from './config_cache.js';

const resource_dir = join(to_dirname(import.meta.url), '..', 'resource');

export function add_devtools_code(path, data) {
    if (!filled_string(path) || Env.is_prod()) {
        return '';
    }
    const extension = extname(path);
    if (!extension.match(/^\.(?:html|htm|php)$/)) {
        return '';
    }
    // add debug data
    const data_path = to_extension(path, 'wyvr.json');
    write_json(data_path, data);
    const debug_code_content = read(join(resource_dir, 'devtools_code.js'))
        .replace(/\{release_path\}/g, data_path.replace(ReleasePath.get(), ''))
        .replace(/\{shortcode_path\}/g, path.replace(ReleasePath.get(), ''))
        .replace(/\{identifier\}/g, data._wyvr?.identifier);

    const ws_content = read(join(resource_dir, 'client_socket.js'));

    return debug_code_content + ws_content;
}

/**
 *  Add dev note to the content
 * @param {string} file
 * @param {string} content
 * @returns {string}
 */
export function add_dev_note(file, content) {
    if (!filled_string(file)) {
        return content;
    }
    const ptree = get_config_cache('package_tree');
    const file_info = ptree[file]
        ? `package: ${ptree[file].name}\n   path: ${join(
              ptree[file].path,
              file
          )}`
        : `source: ${file}`;
    const dev_node = Env.is_dev()
        ? `changes made in this file will not processed by the dev command\n   `
        : '';
    const note = `/*\n   wyvr generated file\n   ${dev_node}${file_info}\n*/\n`;
    const extension = extname(file);
    switch (extension) {
        case '.svelte':
            return content.replace(/<script[^>]*>/, `$&\n${note}`);
        case '.js':
        case '.mjs':
        case '.cjs':
        case '.ts':
        case '.css':
        case '.scss':
            return note + content;
    }
    return content;
}
