import { Logger } from '../utils/logger.js';
import { process } from '../utils/media.js';
import { filled_array } from '../utils/validate.js';

export async function media(files) {
    if (!filled_array(files)) {
        return;
    }

    for (const file of files) {
        Logger.debug('file', file);
        await process(file);
    }
}
