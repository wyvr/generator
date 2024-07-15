import process from 'node:process';
import { WorkerStatus } from './struc/worker_status.js';
import { IsWorker } from './vars/is_worker.js';
import { send_status } from './worker/communication.js';
import { process_message } from './worker/process_message.js';
import { Cwd } from './vars/cwd.js';

IsWorker.set(true);
Cwd.set(process.cwd());

process.title = `wyvr worker ${process.pid}`;

send_status(WorkerStatus.exists);

process.on('message', async (msg) => {
    await process_message(msg);
});
// catch when master exited and kill the worker
process.on('exit', () => {
    setTimeout(() => process.exit(), 500);
});

global.cache = {};
