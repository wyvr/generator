import { WorkerAction } from '../struc/worker_action.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { Logger } from '../utils/logger.js';
import { filled_array, filled_object, is_func } from '../utils/validate.js';
import { send_action } from '../worker/communication.js';
import { get_error_message } from '../utils/error.js';
import { append_entry_to_collections } from '../utils/collections.js';
import { load_route } from '../utils/routes.js';
import { collection_entry } from '../model/collection.js';

export async function collections(routes) {
    if (!filled_array(routes)) {
        return;
    }
    let collections = {};
    for (const route of routes) {
        Logger.debug('route collection', route.rel_path);
        const code = await load_route(route.path);
        if (!code || !is_func(code.getCollection)) {
            continue;
        }
        try {
            // getCollection has to provide the data for the collection entry as array, object shortcut is not allowed
            const route_collections = await code.getCollection({ route });
            if (filled_array(route_collections)) {
                Logger.debug('collection of route', route.rel_path, route_collections);
                route_collections.forEach((entry) => {
                    append_entry_to_collections(collections, collection_entry(entry));
                });
            }
        } catch (e) {
            Logger.error(get_error_message(e, route.path, 'getCollection'));
        }
    }
    if (filled_object(collections)) {
        const collections_emit = {
            type: WorkerEmit.collections,
            collections,
        };
        send_action(WorkerAction.emit, collections_emit);
    }
}
