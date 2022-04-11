import process from 'process';
import { WorkerStatus } from './struc/worker_status.js';
import { send_status } from './worker/communication.js';

process.title = `wyvr worker ${process.pid}`;

send_status(WorkerStatus.exists);

process.on('message', async (msg) => {
    // console.log(process.pid, msg);
});
