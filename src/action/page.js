import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { Event } from '../utils/event.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { collect_pages } from '../utils/pages.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';
import { append_entry_to_collections } from '../utils/collections.js';

export async function pages(package_tree, mtime) {
    const name = 'page';
    const identifier_name = get_name(WorkerEmit.identifier);
    const identifiers = {};
    const collection_name = get_name(WorkerEmit.collection);
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
        const collection_id = Event.on('emit', collection_name, (data) => {
            if (!data || !data.collection) {
                return;
            }
            data.collection.forEach((entry) => {
                collections = append_entry_to_collections(collections, entry);
            });
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
        Event.off('emit', collection_name, collection_id);

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
