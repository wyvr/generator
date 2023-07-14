import { join } from 'path';
import { WorkerAction } from '../struc/worker_action.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { clone } from '../utils/json.js';
import { Logger } from '../utils/logger.js';
import { execute_page, write_pages } from '../utils/pages.js';
import { filled_array, is_null } from '../utils/validate.js';
import { send_action } from '../worker/communication.js';
import { process_page_data } from './process_page_data.js';

export async function page(files) {
    if (!filled_array(files)) {
        return;
    }
    const collections = [];
    const identifiers_cache = {};
    let pages = [];
    for (const page of files) {
        Logger.debug('page', page);
        const wyvr_pages = await execute_page(page);
        if (is_null(wyvr_pages)) {
            continue;
        }
        const mtime = global.cache.mtime ? global.cache.mtime[page.rel_path] : undefined;
        const processed_pages = await Promise.all(
            wyvr_pages.map(async (wyvr_page) => {
                const page_data = await process_page_data(wyvr_page, mtime);
                // page is required to identify the correct page when rebuilding
                page_data._wyvr.page = join(page.pkg.path, page.rel_path);
                page_data._wyvr.pkg = page.pkg.name;
                if (page_data._wyvr.collection) {
                    collections.push(...page_data._wyvr.collection);
                }
                if (page_data._wyvr.identifier && page_data._wyvr.identifier_data) {
                    if (!identifiers_cache[page_data._wyvr.identifier] && !page_data._wyvr.static) {
                        const identifier_emit = clone(page_data._wyvr.identifier_data);
                        identifier_emit.type = WorkerEmit.identifier;
                        // emit identifier only when it was not added to the cache before
                        // or avoid when the given data has to be static => no JS
                        identifiers_cache[page_data._wyvr.identifier] = true;
                        send_action(WorkerAction.emit, identifier_emit);
                    }
                }
                return page_data;
            })
        );
        pages = write_pages(processed_pages);
    }

    if (filled_array(collections)) {
        const collection_emit = {
            type: WorkerEmit.collection,
            collection: collections,
        };
        send_action(WorkerAction.emit, collection_emit);
    }
    send_action(WorkerAction.emit, {
        type: WorkerEmit.page,
        pages,
    });
}
