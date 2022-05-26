import { Logger } from '../utils/logger.js';
import { execute_route } from '../utils/route.js';
import { filled_array } from '../utils/validate.js';

export async function route(files) {
    if(!filled_array(files)) {
        return;
    }
    for(const route of files) {
        Logger.info('execute route', route.path);
        const result = await execute_route(route);
        Logger.info('route result', route.path,  result)
    }
}
