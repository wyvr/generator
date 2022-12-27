import { WorkerAction } from '../struc/worker_action.js';
import { WorkerStatus } from '../struc/worker_status.js';
import { clear_cache } from '../utils/i18n.js';
import { Logger } from '../utils/logger.js';
import { Env } from '../vars/env.js';
import { build } from '../worker_action/build.js';
import { compile } from '../worker_action/compile.js';
import { configure } from '../worker_action/configure.js';
import { critical } from '../worker_action/critical.js';
import { dependencies } from '../worker_action/dependencies.js';
import { media } from '../worker_action/media.js';
import { optimize } from '../worker_action/optimize.js';
import { route } from '../worker_action/route.js';
import { scripts } from '../worker_action/scripts.js';
import { transform } from '../worker_action/transform.js';
import { send_status } from './communication.js';

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
        case WorkerAction.route: {
            await route(value);
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
        case WorkerAction.inject: {
            Logger.warning('unknown action', action, 'value', value);
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