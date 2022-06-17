import { Logger } from '../utils/logger.js';
import { filled_array } from '../utils/validate.js';

export async function scripts(identifiers) {
    if (!filled_array(identifiers)) {
        return;
    }

    for (const identifier of identifiers) {
        Logger.info('identifier', identifier);
    }
}
