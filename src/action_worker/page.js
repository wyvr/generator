import { join } from 'node:path';
import { WorkerAction } from '../struc/worker_action.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { clone } from '../utils/json.js';
import { Logger } from '../utils/logger.js';
import { execute_page, get_page_data_path, write_pages } from '../utils/pages.js';
import { filled_array, filled_object, is_null } from '../utils/validate.js';
import { send_action } from '../worker/communication.js';
import { process_page_data } from './process_page_data.js';
import { is_path_valid } from '../utils/reserved_words.js';
import { append_entry_to_collections } from '../utils/collections.js';
import { collection_entry } from '../model/collection.js';
import { STORAGE_MTIME } from '../constants/storage.js';
import { KeyValue } from '../../storage.js';

const mtime_db = new KeyValue(STORAGE_MTIME);

export async function page(files) {
    if (!filled_array(files)) {
        return;
    }
    const collections = {};
    const identifiers_cache = {};
    const pages = [];
    const data_pages = [];
    for (const page of files) {
        Logger.debug('page', page);

        page.urls = [];

        // used the write the data file
        page.data_path = get_page_data_path(page);

        const executed_pages = await execute_page(page);
        if (is_null(executed_pages)) {
            continue;
        }
        const mtime = mtime_db.get(page.rel_path);
        const processed_pages = await Promise.all(
            executed_pages.map(async (wyvr_page) => {
                const page_data = await process_page_data(wyvr_page, mtime);
                if (!is_path_valid(page_data.url)) {
                    return undefined;
                }
                page.urls.push(page_data.url);
                // page is required to identify the correct page when rebuilding
                page_data.$wyvr.page = join(page.pkg.path, page.rel_path);
                page_data.$wyvr.pkg = page.pkg.name;
                if (page_data.$wyvr.collection) {
                    for (const entry of page_data.$wyvr.collection) {
                        append_entry_to_collections(collections, collection_entry(entry));
                    }
                }
                if (page_data.$wyvr.identifier && page_data.$wyvr.identifier_data) {
                    if (!identifiers_cache[page_data.$wyvr.identifier] && !page_data.$wyvr.static) {
                        const identifier_emit = clone(page_data.$wyvr.identifier_data);
                        identifier_emit.type = WorkerEmit.identifier;
                        // emit identifier only when it was not added to the cache before
                        // or avoid when the given data has to be static => no JS
                        identifiers_cache[page_data.$wyvr.identifier] = true;
                        send_action(WorkerAction.emit, identifier_emit);
                    }
                }
                // @obsolete handle old obsolete _wyvr property
                page_data._wyvr = page_data.$wyvr;
                return page_data;
            })
        );
        data_pages.push(...write_pages(processed_pages.filter(Boolean)));
        pages.push(page);
    }

    if (filled_object(collections)) {
        const collections_emit = {
            type: WorkerEmit.collections,
            collections
        };
        send_action(WorkerAction.emit, collections_emit);
    }
    send_action(WorkerAction.emit, {
        type: WorkerEmit.page,
        pages,
        data_pages
    });
}
