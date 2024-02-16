import { get_critical_css } from '../utils/critical.js';
import { filled_array, filled_object } from '../utils/validate.js';
import { exists, read } from '../utils/file.js';
import { join } from 'path';
import { ReleasePath } from '../vars/release_path.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { WorkerAction } from '../struc/worker_action.js';
import { send_action } from '../worker/communication.js';
import { Logger } from '../utils/logger.js';
import { get_error_message } from '../utils/error.js';

export async function critical(entries) {
    if (!filled_array(entries)) {
        return;
    }

    const critical = {};

    for (const entry of entries) {
        try {
            const path = join(ReleasePath.get(), entry.file);
            if (!exists(path)) {
                continue;
            }
            const css = await get_critical_css(read(path), entry.file);
            if (css) {
                critical[entry.identifier] = css;
            }
        } catch (e) {
            Logger.error(get_error_message(e, entry.file, 'critical'));
        }
    }
    if (filled_object(critical)) {
        const critical_emit = {
            type: WorkerEmit.critical,
            critical
        };
        send_action(WorkerAction.emit, critical_emit);
    }
}
