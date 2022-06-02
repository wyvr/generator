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
        const processed_pages = wyvr_pages.map((wyvr_page) => process_page_data(wyvr_page));
        write_routes(processed_pages);
    }
}
