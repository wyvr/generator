import { WorkerAction } from '../struc/worker_action.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { parse_content, update_file } from '../utils/dep.js';
import { dependencies_from_content } from '../utils/dependency.js';
import { exists, read } from '../utils/file.js';
import { filled_array, is_null } from '../utils/validate.js';
import { send_action } from '../worker/communication.js';

export async function dependencies(files) {
    if (!filled_array(files)) {
        return false;
    }
    for (const file of files) {
        if (!exists(file)) {
            continue;
        }
        const content = read(file);
        const parsed = parse_content(content, file);
        if(parsed) {
            update_file(parsed.rel_path, parsed.dependencies, parsed?.config?.render);
        }
        // @TODO OLD
        // build and send dependencies
        const result = dependencies_from_content(content, file);
        if (!is_null(result)) {
            // send dependencies
            const dependency_emit = {
                type: WorkerEmit.dependencies,
                dependencies: result.dependencies,
            };
            send_action(WorkerAction.emit, dependency_emit);
            // send translations
            const i18n_emit = {
                type: WorkerEmit.i18n,
                i18n: result.i18n,
            };
            send_action(WorkerAction.emit, i18n_emit);
        } else {
            //@TODO
        }
    }
    return true;
}
