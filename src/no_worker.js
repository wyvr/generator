import { WorkerStatus } from './struc/worker_status.js';
import { Event } from './utils/event.js';
import { send_status, useIPC } from './worker/communication.js';
import { process_message } from './worker/process_message.js';

export function NoWorker() {
    useIPC(false);

    Event.on('process', 'message', async (msg) => {
        await process_message(msg);
    });

    send_status(WorkerStatus.exists);

    global.cache = {};
}
