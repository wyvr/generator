import { WorkerAction } from '../struc/worker_action.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { execute_route, write_routes } from '../utils/route.js';
import { filled_array, is_null } from '../utils/validate.js';
import { send_action } from '../worker/communication.js';
import { process_page_data } from './process_page_data.js';

export async function route(files) {
    if (!filled_array(files)) {
        return;
    }
    const collections = [];
    for (const route of files) {
        const wyvr_pages = await execute_route(route);
        if (is_null(wyvr_pages)) {
            continue;
        }
        const processed_pages = wyvr_pages.map((wyvr_page) => {
            const page = process_page_data(wyvr_page);
            if (page._wyvr.collection) {
                collections.push(...page._wyvr.collection);
            }
            return page;
        });
        write_routes(processed_pages);
    }
    if (filled_array(collections)) {
        const collection_emit = {
            type: WorkerEmit.collection,
            collection: collections,
        };
        send_action(WorkerAction.emit, collection_emit);
    }
}
