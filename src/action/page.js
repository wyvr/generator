import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { Event } from '../utils/event.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { collect_pages } from '../utils/pages.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';
import { merge_collections } from '../utils/collections.js';
import { filled_object } from '../utils/validate.js';

export async function pages(package_tree, mtime) {
    const name = 'page';
    const identifier_name = get_name(WorkerEmit.identifier);
    const identifiers = {};
    const collections_name = get_name(WorkerEmit.collections);
    let collections = {};

    await measure_action(name, async () => {
        const identifier_id = Event.on('emit', identifier_name, (data) => {
            if (!data) {
                return;
            }
            Logger.debug('emit identifier', data);
            delete data.type;
            identifiers[data.identifier] = data;
        });
        const collections_id = Event.on('emit', collections_name, (data) => {
            if (!filled_object(data?.collections)) {
                return;
            }
            collections = merge_collections(collections, data.collections);
        });

        const data = collect_pages(undefined, package_tree);

        WorkerController.set_all_workers('mtime', mtime);

        // wrap in plugin
        const caller = await Plugin.process(name, data);
        await caller(async (data) => {
            await WorkerController.process_in_workers(WorkerAction.page, data, 10);
        });

        WorkerController.set_all_workers('mtime', undefined);

        // remove listeners
        Event.off('emit', identifier_name, identifier_id);
        Event.off('emit', collections_name, collections_id);

        const identifier_length = Object.keys(identifiers).length;
        Logger.info(
            'found',
            identifier_length,
            identifier_length == 1 ? 'identifier' : 'identifiers',
            Logger.color.dim('different layout combinations')
        );
    });

    return { identifiers, collections };
}
