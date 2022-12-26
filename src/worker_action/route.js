import { join } from 'path';
import { WorkerAction } from '../struc/worker_action.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { clone } from '../utils/json.js';
import { Logger } from '../utils/logger.js';
import { execute_route, write_routes } from '../utils/route.js';
import { filled_array, is_null } from '../utils/validate.js';
import { send_action } from '../worker/communication.js';
import { process_page_data } from './process_page_data.js';

export async function route(files) {
    if (!filled_array(files)) {
        return;
    }
    const collections = [];
    const identifiers_cache = {};
    let routes = [];
    for (const route of files) {
        Logger.debug('route', route);
        const wyvr_pages = await execute_route(route);
        if (is_null(wyvr_pages)) {
            continue;
        }
        const mtime = global.cache.mtime ? global.cache.mtime[route.rel_path] : undefined;
        const processed_pages = await Promise.all(
            wyvr_pages.map(async (wyvr_page) => {
                const page = await process_page_data(wyvr_page, mtime);
                // route is required to identify the correct route when rebuilding
                page._wyvr.route = join(route.pkg.path, route.rel_path);
                page._wyvr.pkg = route.pkg.name;
                if (page._wyvr.collection) {
                    collections.push(...page._wyvr.collection);
                }
                if (page._wyvr.identifier && page._wyvr.identifier_data) {
                    if (!identifiers_cache[page._wyvr.identifier] && !page._wyvr.static) {
                        const identifier_emit = clone(page._wyvr.identifier_data);
                        identifier_emit.type = WorkerEmit.identifier;
                        // emit identifier only when it was not added to the cache before
                        // or avoid when the given data has to be static => no JS
                        identifiers_cache[page._wyvr.identifier] = true;
                        send_action(WorkerAction.emit, identifier_emit);
                    }
                }
                return page;
            })
        );
        routes = write_routes(processed_pages);
    }

    if (filled_array(collections)) {
        const collection_emit = {
            type: WorkerEmit.collection,
            collection: collections,
        };
        send_action(WorkerAction.emit, collection_emit);
    }
    send_action(WorkerAction.emit, {
        type: WorkerEmit.route,
        routes,
    });
}
