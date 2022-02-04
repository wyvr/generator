import { fail } from '@lib/helper/endings';
import { Plugin } from '@lib/plugin';
import { Logger } from '@lib/logger';
import { IObject } from '@lib/interface/object';
import { WorkerController } from '@lib/worker/controller';
import { WorkerAction } from '@lib/struc/worker/action';
import { WorkerEmit } from '@lib/struc/worker/emit';
import { File } from '@lib/file';

export const inject = async (worker_controller: WorkerController, list: string[]): Promise<[IObject, IObject]> => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [err_before, config_before, list_before] = await Plugin.before('inject', list);
    /* eslint-enable */
    if (err_before) {
        fail(err_before);
        return [{}, null];
    }

    const shortcode_identifiers = {};
    const media = {};
    let has_media = false;

    // subsribe to the events
    const on_identifier_index = worker_controller.events.on('emit', WorkerEmit.inject_shortcode_identifier, (data) => {
        // add the results to the shortcode identifier list
        if (data && data.data) {
            Object.keys(data.data).forEach((key) => {
                shortcode_identifiers[key] = data.data[key];
            });
            has_media = true;
        }
    });
    const on_media_index = worker_controller.events.on('emit', WorkerEmit.inject_media, (data) => {
        // add the results to the media files
        if (data && data.data) {
            Object.keys(data.data).forEach((key) => {
                media[key] = data.data[key];
            });
            has_media = true;
        }
    });

    // process in worker
    await worker_controller.process_in_workers('inject', WorkerAction.inject, list_before, 100);

    // remove the events
    worker_controller.events.off('emit', WorkerEmit.inject_shortcode_identifier, on_identifier_index);
    worker_controller.events.off('emit', WorkerEmit.inject_media, on_media_index);

    const len = list_before.length;

    for (let index = 0; index < len; index++) {
        const file = list_before[index];

        const head = [],
            body = [];
        const content = File.read(file);
        if (!content) {
            continue;
        }
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const [err_after, config_after, file_after, content_after, head_after, body_after] = await Plugin.after(
            'inject',
            file,
            content,
            head,
            body
        );
        /* eslint-enable */
        if (err_after) {
            Logger.error(err_after);
            continue;
        }
        const injected_content = content
            .replace(/<\/head>/, `${head_after.join('')}</head>`)
            .replace(/<\/body>/, `${body_after.join('')}</body>`);

        File.write(file, injected_content);
    }

    return [shortcode_identifiers, has_media ? media : null];
};
