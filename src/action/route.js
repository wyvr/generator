import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { nano_to_milli } from '../utils/convert.js';
import { Event } from '../utils/event.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { collect_routes } from '../utils/route.js';
import { WorkerController } from '../worker/controller.js';
import { wait_until_idle } from './wait_until_idle.js';

export async function routes(package_tree) {
    // wait until all workers are ready
    await wait_until_idle(30);

    const name = 'route';
    const identifier_name = get_name(WorkerEmit.identifier);
    const start = process.hrtime.bigint();
    Logger.start(name);

    const list = collect_routes(undefined, package_tree);

    const identifiers = {};
    const listener_id = Event.on('emit', identifier_name, (data) => {
        if (!data) {
            return;
        }
        delete data.type;
        identifiers[data.identifier] = data;
    });

    await Plugin.before(name, list);

    await WorkerController.process_in_workers(WorkerAction.route, list, 10);

    Event.off('emit', identifier_name, listener_id);
    Logger.info('found', Object.keys(identifiers).length, 'identifiers', Logger.color.dim('different layout combinations'));

    await Plugin.after(name, list);

    Logger.stop(name, nano_to_milli(process.hrtime.bigint() - start));
    
    return identifiers;
}
