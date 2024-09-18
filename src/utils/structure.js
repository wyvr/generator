import { ReleasePath } from '../vars/release_path.js';
import { write_json } from './file.js';
import { filled_array, filled_object, filled_string } from './validate.js';

export function write_identifier_structure(identifier_name, roots, index, package_tree) {
    if (!filled_string(identifier_name) || !filled_object(roots)) {
        return;
    }
    const file_index = {};
    const root_files = {};
    // build index
    for (const [key, value] of Object.entries(index)) {
        file_index[key] = value;
        if (!file_index[key]) {
            file_index[key] = {};
        }
        file_index[key].pkg = package_tree[key];
    }
    // make the root files with the file index
    for (const [key, value] of Object.entries(roots)) {
        if (!filled_array(value)) {
            continue;
        }
        const result = {};
        for (const root of value) {
            if (!file_index[root]) {
                continue;
            }
            result[root] = build_tree(root, file_index);
        }
        root_files[key] = result;
    }
    write_json(ReleasePath.get(`${identifier_name}.wyvr.json`), root_files);
}

function build_tree(root, index) {
    const branch = index[root];
    if (!branch) {
        return undefined;
    }
    if (!filled_array(branch.children)) {
        return { ...branch, children: undefined };
    }
    const children = {};
    for (const child of branch.children) {
        children[child] = build_tree(child, index);
    }
    return { ...branch, children };
}
