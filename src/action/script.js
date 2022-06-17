import { WorkerAction } from '../struc/worker_action.js';
import { worker_action } from './worker_action.js';

export async function scripts(identifier) {
    const name = 'scripts';

    await worker_action(name, WorkerAction.scripts, 1, async () => {
        return Object.keys(identifier).map((key) => identifier[key]);
    });
}
