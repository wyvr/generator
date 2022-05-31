import { WyvrData } from '../model/wyvr_data.js';
import { Config } from '../utils/config.js';
import { execute_route, write_routes } from '../utils/route.js';
import { set_default_values } from '../utils/transform.js';
import { filled_array, is_null } from '../utils/validate.js';

export async function route(files) {
    if (!filled_array(files)) {
        return;
    }
    const default_values = Config.get('default_values');

    for (const route of files) {
        const wyvr_pages = await execute_route(route);
        if (is_null(wyvr_pages)) {
            continue;
        }
        write_routes(wyvr_pages, (wyvr_page) => {
            // enhance the data from the pages
            // set default values when the key is not available in the given data
            wyvr_page._wyvr = WyvrData(wyvr_page._wyvr);
            const enhanced_data = set_default_values(wyvr_page, default_values);
            // const result = create_identifier(enhanced_data);

            // if (!entry.add_to_global) {
            //     return result.data;
            // }
            // nav_data = Generate.add_to_nav(enhanced_data, nav_data);

            // return result.data;
            return enhanced_data;
        });
    }
}
