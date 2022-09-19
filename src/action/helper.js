import { Logger } from '../utils/logger.js';
import { nano_to_milli } from '../utils/convert.js';
import { filled_string, is_func } from '../utils/validate.js';

export async function measure_action(name, fn, minimize_output) {
    if (!filled_string(name)) {
        Logger.error('missing name in base action');
        return;
    }
    if (!is_func(fn)) {
        Logger.error('missing or wrong function in base_action', name);
        return;
    }

    const start = process.hrtime.bigint();
    if (!minimize_output) {
        Logger.start(name);
    }

    await fn();

    if (!minimize_output) {
        Logger.stop(name, nano_to_milli(process.hrtime.bigint() - start));
    }
}
