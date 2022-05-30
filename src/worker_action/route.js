import { execute_route, write_routes } from '../utils/route.js';
import { filled_array } from '../utils/validate.js';

export async function route(files) {
    if (!filled_array(files)) {
        return;
    }
    for (const route of files) {
        const route_entries = await execute_route(route);
        write_routes(route_entries);
    }
}
