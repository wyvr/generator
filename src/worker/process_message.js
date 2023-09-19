import { WorkerAction } from '../struc/worker_action.js';
import { WorkerStatus } from '../struc/worker_status.js';
import { set_config_cache } from '../utils/config_cache.js';
import { clear_cache } from '../utils/i18n.js';
import { Logger } from '../utils/logger.js';
import { Env } from '../vars/env.js';
import { build } from '../action_worker/build.js';
import { compile } from '../action_worker/compile.js';
import { configure } from '../action_worker/configure.js';
import { critical } from '../action_worker/critical.js';
import { dependencies } from '../action_worker/dependencies.js';
import { media } from '../action_worker/media.js';
import { optimize } from '../action_worker/optimize.js';
import { page } from '../action_worker/page.js';
import { scripts } from '../action_worker/scripts.js';
import { transform } from '../action_worker/transform.js';
import { send_status } from './communication.js';
import { collections } from '../action_worker/collections.js';
import { route } from '../action_worker/route.js';

export async function process_message(msg) {
    const action = msg?.action?.key;
    const value = msg?.action?.value;
    if (!value) {
        Logger.warning('ignored message from main, no value given', msg);
        return;
    }

    if (action === WorkerAction.configure) {
        const configured = await configure(value);
        if (configured) {
            send_status(WorkerStatus.idle);
        }
        return configured;
    }

    send_status(WorkerStatus.busy);
    switch (action) {
        case WorkerAction.set: {
            const set_key = value.key,
                set_value = value.value;
            global.cache[set_key] = set_value;
            break;
        }
        case WorkerAction.set_config_cache: {
            await set_config_cache(value.segment, value.value);
            break;
        }
        case WorkerAction.transform: {
            await transform(value);
            break;
        }
        case WorkerAction.dependencies: {
            await dependencies(value);
            break;
        }
        case WorkerAction.compile: {
            await compile(value);
            break;
        }
        case WorkerAction.page: {
            await page(value);
            break;
        }
        case WorkerAction.build: {
            await build(value);
            break;
        }
        case WorkerAction.scripts: {
            await scripts(value);
            break;
        }
        case WorkerAction.media: {
            await media(value);
            break;
        }
        case WorkerAction.critical: {
            await critical(value);
            break;
        }
        case WorkerAction.optimize: {
            await optimize(value);
            break;
        }
        case WorkerAction.route: {
            await route(value);
            break;
        }
        case WorkerAction.collections: {
            await collections(value);
            break;
        }
        case WorkerAction.cleanup: {
            Logger.debug('cleanup worker');
            break;
        }
        case WorkerAction.status: {
            Logger.warning('setting status from outside is not allowed');
            break;
        }
        default:
            Logger.warning('unknown message action from outside', msg);
            break;
    }
    send_status(WorkerStatus.done);
    // @TODO check memory limit, if near kill process
    send_status(WorkerStatus.idle);

    if (Env.is_dev()) {
        clear_cache();
    }
}
