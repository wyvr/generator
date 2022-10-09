import { compile_server_svelte } from '../utils/compile.js';
import { exists, read_json, to_index, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { generate_page_code } from '../utils/generate.js';
import { filled_array, filled_object, filled_string } from '../utils/validate.js';
import { render_server_compiled_svelte } from '../utils/compile_svelte.js';
import { ReleasePath } from '../vars/release_path.js';
import { join } from 'path';
import { Cwd } from '../vars/cwd.js';
import { FOLDER_GEN_CSS } from '../constants/folder.js';
import { search_segment } from '../utils/segment.js';
import { replace_media } from '../utils/media.js';
import { send_action } from '../worker/communication.js';
import { WorkerAction } from '../struc/worker_action.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { write_css_file } from '../utils/css.js';
import { add_devtools_code } from '../utils/devtools.js';
import { replace_shortcode } from '../utils/shortcode.js';
import { inject_client_socket, inject_translations } from '../utils/build.js';

export async function build(files) {
    if (!filled_array(files)) {
        return;
    }
    const release_path = ReleasePath.get();
    const media_files = {};
    let has_media = false;
    let media_query_files = {};
    const identifier_files = {};

    for (const file of files) {
        Logger.debug('build', file);
            const raw_data = read_json(file);
            const data = process_page_data(raw_data, raw_data?._wyvr?.mtime);
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
        const path = join(release_path, to_index(data.url, data._wyvr.extension));
        if (rendered_result?.result) {
            // replace shortcodes
            const shortcode_result = await replace_shortcode(rendered_result.result.html, data, file);
            if (shortcode_result) {
                if (shortcode_result.identifier && shortcode_result.shortcode_imports) {
                    const shortcode_emit = {
                        type: WorkerEmit.identifier,
                        identifier: shortcode_result.identifier,
                        imports: shortcode_result.shortcode_imports,
                    };

                    if (shortcode_result.media_query_files) {
                        Object.keys(shortcode_result.media_query_files).forEach((key) => {
                            media_query_files[key] = shortcode_result.media_query_files[key];
                        });
                    }

                    send_action(WorkerAction.emit, shortcode_emit);
                }

                // extract media files
                const media_result = await replace_media(shortcode_result.html);
                if (media_result.has_media) {
                    has_media = true;
                    Object.keys(media_result.media).forEach((key) => {
                        media_files[key] = media_result.media[key];
                    });
                }
                content = media_result.content;
            }

            // inject translations
            // inject websocket connection
            content = inject_translations(inject_client_socket(content), data?._wyvr?.language);

            // write the html code
            write(path, add_devtools_code(content, path, data));

            // write css
            if (filled_string(identifier) && search_segment(rendered_result.result, 'css.code')) {
                const css_file_path = Cwd.get(FOLDER_GEN_CSS, `${identifier}.css`);
                if (!exists(css_file_path) || global.cache.force_media_query_files) {
                    media_query_files = write_css_file(
                        css_file_path,
                        rendered_result.result.css.code,
                        media_query_files
                    );
                }
            }
        }
    }
    // emit media files
    if (has_media) {
        const media_emit = {
            type: WorkerEmit.media,
            media: media_files,
        };
        send_action(WorkerAction.emit, media_emit);
    }
    // emit media query files
    if (filled_object(media_query_files)) {
        const media_query_files_emit = {
            type: WorkerEmit.media_query_files,
            media_query_files,
        };
        send_action(WorkerAction.emit, media_query_files_emit);
    }
    const identifier_files_emit = {
        type: WorkerEmit.identifier_files,
        identifier_files,
    };
    send_action(WorkerAction.emit, identifier_files_emit);
}
