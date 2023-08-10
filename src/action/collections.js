import { append_entry_to_collections, build_collection_entry } from '../utils/collections.js';
import { get_config_cache } from '../utils/config_cache.js';
import { get_error_message } from '../utils/error.js';
import { Logger } from '../utils/logger.js';
import { load_route } from '../utils/routes.js';
import { Storage } from '../utils/storage.js';
import { filled_array, filled_object, is_func } from '../utils/validate.js';
import { measure_action } from './helper.js';

export async function collections(page_collections) {
    const name = 'collections';
    // @TODO handle collections in rebuild

    await measure_action(name, async () => {
        let collections = {};
        if (filled_object(page_collections)) {
            collections = page_collections;
        }

        // load routes and execute the method getCollection of them to extract the available collections
        const routes_cache = get_config_cache('route.cache')?.cache;
        if (routes_cache) {
            // @TODO move logic to worker
            await Promise.all(
                routes_cache.map(async (route) => {
                    const code = await load_route(route.path);
                    // getCollection has to provide the complete data for the collection entry as array
                    if (!code || !is_func(code.getCollection)) {
                        return null;
                    }
                    try {
                        const route_collections = code.getCollection({ route });
                        if (filled_array(route_collections)) {
                            Logger.debug('collection of route', route.rel_path, route_collections);
                            route_collections.forEach((entry) => {
                                collections = append_entry_to_collections(
                                    collections,
                                    build_collection_entry(entry, entry.url, entry.name)
                                );
                            });
                        }
                    } catch (e) {
                        Logger.error(get_error_message(e, route.path, 'getCollection'));
                        return null;
                    }
                    return null;
                })
            );
        }

        // sort the collection entries
        Object.keys(collections).forEach((key) => {
            collections[key] = collections[key]
                .sort((a, b) => a.url.localeCompare(b.url))
                .sort((a, b) => {
                    if (a.order > b.order) {
                        return -1;
                    }
                    if (a.order < b.order) {
                        return 1;
                    }
                    return 0;
                });
        });

        Logger.info(
            'collected',
            Object.keys(collections).length,
            'collections',
            Logger.color.dim(Object.keys(collections).join(','))
        );
        // delete the existing collections
        // @TODO changed collections does not always gets removed
        await Storage.clear('collection');
        await Storage.set('collection', collections);
    });
}
