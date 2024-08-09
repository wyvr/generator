import { FOLDER_GEN_DATA } from '../constants/folder.js';
import { STORAGE_COLLECTION, STORAGE_OPTIMIZE_MEDIA_QUERY_FILES } from '../constants/storage.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { KeyValue } from '../utils/database/key_value.js';
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
    const media_query_files_name = get_name(WorkerEmit.media_query_files);
    const media_query_files = {};
    const identifier_files_name = get_name(WorkerEmit.identifier_files);
    const identifier_files = {};

    await measure_action(name, async () => {
        const identifier_id = Event.on('emit', identifier_name, (data) => {
            if (!data) {
                return;
            }
            Logger.debug('emit identifier', data);
            data.type = undefined;
            identifiers[data.identifier] = data;
        });
        const media_id = Event.on('emit', media_name, (data) => {
            if (!data) {
                return;
            }
            for (const key of Object.keys(data.media)) {
                media[key] = data.media[key];
            }
        });
        const media_query_files_id = Event.on(
            'emit',
            media_query_files_name,
            (data) => {
                if (!data || !data.media_query_files) {
                    return;
                }
                for (const file of Object.keys(data.media_query_files)) {
                    media_query_files[file] = data.media_query_files[file];
                }
            }
        );

        const identifier_files_id = Event.on(
            'emit',
            identifier_files_name,
            (data) => {
                if (!data || !data.identifier_files) {
                    return;
                }
                for (const identifier of Object.keys(data.identifier_files)) {
                    if (!identifier_files[identifier]) {
                        identifier_files[identifier] = [];
                    }
                    identifier_files[identifier].push(
                        ...data.identifier_files[identifier]
                    );
                }
            }
        );

        const data = collect_files(FOLDER_GEN_DATA, 'json');

        // wrap in plugin
        const caller = await Plugin.process(name, data);
        await caller(async (data) => {
            await WorkerController.process_in_workers(
                WorkerAction.build,
                data,
                100
            );
        });

        // remove listeners
        Event.off('emit', identifier_name, identifier_id);
        Event.off('emit', media_name, media_id);
        Event.off('emit', media_query_files_name, media_query_files_id);
        Event.off('emit', identifier_files_name, identifier_files_id);

        // store the identifier_files in the collection storage
        // used to create the critical files, here is the reference with identifier has which file assigned to them
        const collection_db = new KeyValue(STORAGE_COLLECTION);
        collection_db.set('identifier_files', identifier_files);

        // set the media query files from the generated pages
        const media_query_files_db = new KeyValue(
            STORAGE_OPTIMIZE_MEDIA_QUERY_FILES
        );
        media_query_files_db.setObject(media_query_files);
        media_query_files_db.close();

        const identifier_length = Object.keys(identifiers).length;
        Logger.info(
            'found',
            identifier_length,
            identifier_length === 1 ? 'identifier' : 'identifiers',
            Logger.color.dim('different layout combinations')
        );
        Logger.info('found', Object.keys(media).length, 'media files');
    });

    return {
        identifiers,
        media,
        media_query_files,
    };
}
