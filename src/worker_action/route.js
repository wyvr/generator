import { execute_route, write_routes } from '../utils/route.js';
import { filled_array, is_null } from '../utils/validate.js';
import { process_page_data } from './process_page_data.js';

export async function route(files) {
    if (!filled_array(files)) {
        return;
    }

    for (const route of files) {
        const wyvr_pages = await execute_route(route);
        if (is_null(wyvr_pages)) {
            continue;
        }
        write_routes(wyvr_pages, (wyvr_page) => {
            return process_page_data(wyvr_page);
        });
    }
}
