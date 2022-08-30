import { join } from 'path';
import { ReleasePath } from '../vars/release_path.js';
import { to_extension, write_json } from './file.js';
import { filled_string, match_interface } from './validate.js';

export function get_structure(file, tree, file_config, package_tree) {
    if (!filled_string(file) || !tree || !file_config || !package_tree) {
        return undefined;
    }
    const src_file = `src/${file}`;
    const components = (tree[file] || []).map((child) => get_structure(child, tree, file_config, package_tree));
    return {
        file,
        pkg: package_tree[src_file],
        config: file_config[file],
        components,
    };
}

export function write_identifier_structure(identifier, tree, file_config, package_tree) {
    if (
        !match_interface(identifier, { identifier: true, doc: true, layout: true, page: true }) ||
        !tree ||
        !file_config ||
        !package_tree
    ) {
        return;
    }
    const struct = {};
    ['doc', 'layout', 'page'].forEach((type) => {
        const root = to_extension(join(type, identifier[type]), 'svelte');
        struct[type] = get_structure(root, tree, file_config, package_tree);
    });
    write_json(join(ReleasePath.get(), `${identifier.identifier}.json`), struct);
}
