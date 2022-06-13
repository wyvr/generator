import { nano_to_milli } from '../utils/convert.js';
import { Logger } from '../utils/logger.js';
import { filled_string, is_func } from '../utils/validate.js';
import { wait_until_idle } from './wait_until_idle.js';

export async function base_action(name, fn) {
    if (!filled_string(name)) {
        Logger.error('missing name in base action');
        return;
    }
    if (!is_func(fn)) {
        Logger.error('missing or wrong function in base_action', name);
        return;
    }
    // wait until all workers are ready
    await wait_until_idle(30);

    const start = process.hrtime.bigint();
    Logger.start(name);

    await fn();

    Logger.stop(name, nano_to_milli(process.hrtime.bigint() - start));
}
