import { FOLDER_GEN_DATA } from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { Event } from '../utils/event.js';
import { collect_files } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';

export async function build() {
    const name = 'build';
    const identifier_name = get_name(WorkerEmit.identifier);
    const identifiers = {};
    const media_name = get_name(WorkerEmit.media);
    const media = {};

    await measure_action(name, async () => {
        const identifier_id = Event.on('emit', identifier_name, (data) => {
            if (!data) {
                return;
            }
            delete data.type;
            identifiers[data.identifier] = data;
        });
        const media_id = Event.on('emit', media_name, (data) => {
            if (!data) {
                return;
            }
            Object.keys(data.media).forEach((key) => {
                media[key] = data.media[key];
            });
        });

        const data = collect_files(FOLDER_GEN_DATA, 'json');

        // wrap in plugin
        const caller = await Plugin.process(name, data);
        await caller(async (data) => {
            await WorkerController.process_in_workers(WorkerAction.build, data, 100);
        });

        // remove listeners
        Event.off('emit', identifier_name, identifier_id);
        Event.off('emit', media_name, media_id);

        Logger.info(
            'found',
            Object.keys(identifiers).length,
            'identifiers',
            Logger.color.dim('different layout combinations')
        );
        Logger.info('found', Object.keys(media).length, 'media files');
    });

    return {
        identifiers,
        media,
    };
}
