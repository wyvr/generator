import { join } from 'node:path';
import { FOLDER_SRC } from '../constants/folder.js';
import { ReleasePath } from '../vars/release_path.js';
import { to_extension, write_json } from './file.js';
import { filled_string, match_interface } from './validate.js';
import { uniq_values } from './uniq.js';

export function get_structure(file, tree, file_config, package_tree) {
    if (!filled_string(file) || !tree || !file_config || !package_tree) {
        return undefined;
    }
    let src_file = file;
    if (src_file.indexOf(FOLDER_SRC) != 0) {
        src_file = join(FOLDER_SRC, file);
    }
    const components = uniq_values(tree[src_file] || []).map((child) => get_structure(child, tree, file_config, package_tree));
    return {
        file: src_file,
        pkg: package_tree[src_file],
        config: file_config[src_file],
        components
    };
}

export function write_identifier_structure(identifier, tree, file_config, package_tree) {
    if (!package_tree || !match_interface(identifier, { identifier: true, doc: true, layout: true, page: true }) || !tree || !file_config) {
        return;
    }
    const struct = {};
    ['doc', 'layout', 'page'].forEach((type) => {
        const root = to_extension(join(type, identifier[type]), 'svelte');
        struct[type] = get_structure(root, tree, file_config, package_tree);
    });
    write_json(join(ReleasePath.get(), `${identifier.identifier}.json`), struct);
}
