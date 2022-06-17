import { dirname, join } from 'path';
import { filled_string, is_null } from './validate.js';

export function dependencies_from_content(content, file) {
    if (!filled_string(content) || !filled_string(file)) {
        return undefined;
    }
    const file_path = dirname(file);
    const deps = {};
    content.replace(/import .*? from ["']([^"']+)["'];?/g, (match, dep) => {
        if (is_null(deps[file])) {
            deps[file] = [];
        }
        dep = dep.replace(/^\.\//, '');
        dep = join(file_path, dep);
        // @TODO search file
        deps[file].push(dep);
        return match;
    });

    return deps;
}
