import { compile_server_svelte } from '../utils/compile.js';
import { read_json, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { generate_page_code } from '../utils/generate.js';
import { filled_array, filled_object, is_null } from '../utils/validate.js';
import { render_server_compiled_svelte } from '../utils/compile_svelte.js';
import { send_action } from '../worker/communication.js';
import { WorkerAction } from '../struc/worker_action.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { inject } from '../utils/build.js';
import { get_error_message } from '../utils/error.js';

export async function build(files) {
    if (!filled_array(files)) {
        return;
    }
    const media_files = {};
    let has_media = false;
    let media_query_files = {};
    const identifier_files = {};

    for (const file of files) {
        Logger.debug('build', file);
        try {
            const data = read_json(file);
            if (is_null(data)) {
                Logger.warning('empty data in', file);
                continue;
            }
            const identifier = data?._wyvr?.identifier || 'default';
            // add the current url to the used identifier
            if (!identifier_files[identifier]) {
                identifier_files[identifier] = [];
            }
            identifier_files[identifier].push(data.url);

            let content = generate_page_code(data);

            const exec_result = await compile_server_svelte(content, file);

            const rendered_result = await render_server_compiled_svelte(exec_result, data, file);
            const injected_result = await inject(rendered_result, data, file, identifier, (shortcode_emit) => {
                send_action(WorkerAction.emit, shortcode_emit);
            });
            if (injected_result.has_media) {
                has_media = true;
            }

            // write the html code
            write(injected_result.path, injected_result.content);
        } catch (e) {
            Logger.error(get_error_message(e, file, 'build'));
        }
    }
    // emit media files
    if (has_media) {
        const media_emit = {
            type: WorkerEmit.media,
            media: media_files
        };
        send_action(WorkerAction.emit, media_emit);
    }
    // emit media query files
    if (filled_object(media_query_files)) {
        const media_query_files_emit = {
            type: WorkerEmit.media_query_files,
            media_query_files
        };
        send_action(WorkerAction.emit, media_query_files_emit);
    }
    const identifier_files_emit = {
        type: WorkerEmit.identifier_files,
        identifier_files
    };
    send_action(WorkerAction.emit, identifier_files_emit);
}
