import { WorkerAction } from '../struc/worker_action.js';
import { nano_to_milli } from '../utils/convert.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { collect_routes } from '../utils/route.js';
import { WorkerController } from '../worker/controller.js';
import { wait_until_idle } from './wait_until_idle.js';

export async function routes(package_tree) {
    // wait until all workers are ready
    await wait_until_idle(30);
    
    const name = 'route';
    const start = process.hrtime.bigint();
    Logger.start(name);
    
    const list = collect_routes(undefined, package_tree);

    await Plugin.before(name, list);

    await WorkerController.process_in_workers(WorkerAction.route, list, 10);

    await Plugin.after(name, list);

    Logger.stop(name, nano_to_milli(process.hrtime.bigint() - start));
}
