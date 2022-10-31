import process from 'process';
import { WorkerStatus } from './struc/worker_status.js';
import { IsWorker } from './vars/is_worker.js';
import { send_status } from './worker/communication.js';
import { process_message } from './worker/process_message.js';

IsWorker.set(true);
process.title = `wyvr worker ${process.pid}`;

send_status(WorkerStatus.exists);

process.on('message', async (msg) => {
    await process_message(msg);
});
// catch when master exited and kill the worker
process.on('exit', function () {
    setTimeout(() => process.exit(), 500);
});

global.cache = {};
