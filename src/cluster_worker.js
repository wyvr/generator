import process from 'node:process';
import { WorkerStatus } from './struc/worker_status.js';
import { IsWorker } from './vars/is_worker.js';
import { send_status } from './worker/communication.js';
import { Cwd } from './vars/cwd.js';
import { WorkerAction } from './struc/worker_action.js';
import { app_server } from './utils/server.js';
import { ReleasePath } from './vars/release_path.js';
import { UniqId } from './vars/uniq_id.js';
import { FOLDER_RELEASES } from './constants/folder.js';
import { Plugin } from './utils/plugin.js';
import { Logger } from './utils/logger.js';
import { register_stack } from './utils/global.js';
import { create_heap_snapshot } from './action_worker/heap.js';

export async function ClusterWorker() {
    IsWorker.set(true);
    Cwd.set(process.cwd());

    const build_id = UniqId.load();
    UniqId.set(build_id);
    ReleasePath.set(Cwd.get(FOLDER_RELEASES, build_id));

    process.title = `wyvr cluster worker ${process.pid}`;

    register_stack();

    await Plugin.initialize();

    send_status(WorkerStatus.exists);

    process.on('message', async (msg) => {
        const action = msg?.action?.key;
        const value = msg?.action?.value;
        if (!value) {
            Logger.warning('ignored message from main, no value given', msg);
            return;
        }

        send_status(WorkerStatus.busy);
        if (action === WorkerAction.mode && value?.mode === 'app' && !Number.isNaN(value?.port)) {
            await app_server(value?.port);
            return;
        }
        if (action === WorkerAction.heap) {
            create_heap_snapshot();
            return;
        }
    });

    // create cache
    global.cache = {};
}
