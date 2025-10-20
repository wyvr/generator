import { PLUGIN_COLLECTIONS } from '../constants/plugins.js';
import { STORAGE_COLLECTION } from '../constants/storage.js';
import { WorkerAction } from '../struc/worker_action.js';
import { WorkerEmit, get_name } from '../struc/worker_emit.js';
import { merge_collections, sort_collections } from '../utils/collections.js';
import { get_config_cache } from '../utils/config_cache.js';
import { KeyValue } from '../utils/database/key_value.js';
import { Event } from '../utils/event.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { filled_object } from '../utils/validate.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';

// @NOTE collections are only generated at build time
export async function collections(page_collections) {
    const name = 'collections';
    const collections_name = get_name(WorkerEmit.collections);
    let collections = {};

    await measure_action(name, async () => {
        if (filled_object(page_collections)) {
            collections = page_collections;
        }

        // load routes and execute the method getCollection of them to extract the available collections
        const routes_cache = get_config_cache('route.cache');
        if (routes_cache) {
            const collections_id = Event.on('emit', collections_name, (data) => {
                if (!filled_object(data?.collections)) {
                    return;
                }
                collections = merge_collections(collections, data.collections);
            });

            await WorkerController.process_in_workers(WorkerAction.collections, routes_cache, 1);

            Event.off('emit', collections_name, collections_id);
        }

        const caller = await Plugin.process(PLUGIN_COLLECTIONS, sort_collections(collections));
        collections = await caller(async (collections) => {
            // sort the collection entries
            return collections;
        });

        Logger.info('collected', Object.keys(collections).length, 'collections', Logger.color.dim(Object.keys(collections).join(',')));
        // delete the existing collections
        const collection_db = new KeyValue(STORAGE_COLLECTION);
        collection_db.clear();
        collection_db.setObject(collections);
    });
}
