import { FOLDER_GEN_DATA } from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { Event } from '../utils/event.js';
import { collect_files } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { worker_action } from './worker_action.js';

export async function build() {
    const name = 'build';
    const identifier_name = get_name(WorkerEmit.identifier);
    const identifiers = {};
    const listener_id = Event.on('emit', identifier_name, (data) => {
        if (!data) {
            return;
        }
        delete data.type;
        identifiers[data.identifier] = data;
    });

    await worker_action(name, WorkerAction.build, 100, async () => {
        return collect_files(FOLDER_GEN_DATA, 'json');
    });

    Event.off('emit', identifier_name, listener_id);
    Logger.info(
        'found',
        Object.keys(identifiers).length,
        'identifiers',
        Logger.color.dim('different layout combinations')
    );
}
