import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { Event } from '../utils/event.js';
import { Logger } from '../utils/logger.js';
import { collect_routes } from '../utils/route.js';
import { worker_action } from './worker_action.js';

export async function routes(package_tree) {
    const name = 'route';
    const identifier_name = get_name(WorkerEmit.identifier);
    const identifiers = {};
    const listener_id = Event.on('emit', identifier_name, (data) => {
        if (!data) {
            return;
        }
        delete data.type;
        identifiers[data.identifier] = data;
    });

    await worker_action(name, WorkerAction.route, 10, async () => {
        return collect_routes(undefined, package_tree);
    });
    Event.off('emit', identifier_name, listener_id);
    const identifier_length = Object.keys(identifiers).length;
    Logger.info('found', identifier_length, identifier_length == 1 ? 'identifier' : 'identifiers');

    return identifiers;
}
