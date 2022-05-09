import process from 'process';
import { WorkerAction } from './struc/worker_action.js';
import { WorkerStatus } from './struc/worker_status.js';
import { Logger } from './utils/logger.js';
import { send_status } from './worker/communication.js';
import { configure } from './worker_action/configure.js';
import { transform } from './worker_action/transform.js';

process.title = `wyvr worker ${process.pid}`;

send_status(WorkerStatus.exists);

process.on('message', async (msg) => {
    await process_message(msg);
});

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
        case WorkerAction.transform: {
            await transform(value);
            break;
        }
        case WorkerAction.route:
        case WorkerAction.build:
        case WorkerAction.inject:
        case WorkerAction.scripts:
        case WorkerAction.optimize:
        case WorkerAction.media: {
            Logger.info(action, value);
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
}
