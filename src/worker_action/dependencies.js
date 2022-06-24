import { WorkerAction } from '../struc/worker_action.js';
import { WorkerEmit } from '../struc/worker_emit.js';
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
        // build and send dependencies
        const dependencies = dependencies_from_content(content, file);
        if (!is_null(dependencies)) {
            const dependency_emit = {
                type: WorkerEmit.dependencies,
                dependencies,
            };
            send_action(WorkerAction.emit, dependency_emit);
        }
    }
    return true;
}
