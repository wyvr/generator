import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { Event } from '../utils/event.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { collect_routes } from '../utils/route.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';

export async function routes(package_tree) {
    const name = 'route';
    const identifier_name = get_name(WorkerEmit.identifier);
    const identifiers = {};

    await measure_action(name, async () => {
        const listener_id = Event.on('emit', identifier_name, (data) => {
            if (!data) {
                return;
            }
            delete data.type;
            identifiers[data.identifier] = data;
        });

        const data = collect_routes(undefined, package_tree);

        // wrap in plugin
        const caller = await Plugin.process(name, data);
        await caller(async (data) => {
            await WorkerController.process_in_workers(WorkerAction.route, data, 10);
        });

        // remove listeners
        Event.off('emit', identifier_name, listener_id);

        const identifier_length = Object.keys(identifiers).length;
        Logger.info(
            'found',
            identifier_length,
            identifier_length == 1 ? 'identifier' : 'identifiers',
            Logger.color.dim('different layout combinations')
        );
    });

    return identifiers;
}
