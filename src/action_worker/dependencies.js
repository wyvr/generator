import { Dependency } from '../model/dependency.js';
import { parse_content } from '../utils/dependency.js';
import { exists, read } from '../utils/file.js';
import { filled_array } from '../utils/validate.js';

export async function dependencies(files) {
    if (!filled_array(files)) {
        return false;
    }
    const dep_db = new Dependency();

    for (const file of files) {
        if (!exists(file)) {
            continue;
        }
        const content = read(file);
        const parsed = parse_content(content, file);
        if (parsed) {
            dep_db.update_file(parsed.rel_path, parsed.dependencies, parsed?.config);
        }
    }
    return true;
}
