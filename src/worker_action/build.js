import { compile_server_svelte } from '../utils/compile.js';
import { exists, read_json, to_extension, to_index, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { generate_page_code } from '../utils/generate.js';
import { filled_array, filled_string } from '../utils/validate.js';
import { render_server_compiled_svelte } from '../utils/compile_svelte.js';
import { ReleasePath } from '../vars/release_path.js';
import { join, sep } from 'path';
import { Cwd } from '../vars/cwd.js';
import { FOLDER_CSS, FOLDER_GEN_CSS } from '../constants/folder.js';
import { search_segment } from '../utils/segment.js';
import { replace_media } from '../utils/media.js';
import { send_action } from '../worker/communication.js';
import { WorkerAction } from '../struc/worker_action.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { stringify } from '../utils/json.js';
import { get_language } from '../utils/i18n.js';
import { split_css_into_media_query_files } from '../utils/css.js';
import { to_relative_path } from '../utils/to.js';

export async function build(files) {
    if (!filled_array(files)) {
        return;
    }
    const release_path = ReleasePath.get();
    const media_files = {};
    let has_media = false;
    const media_query_files = {};
    let has_media_query_files = false;

    for (const file of files) {
        Logger.debug('build', file);
        const data = read_json(file);
        const identifier = data._wyvr.identifier;
        let content = generate_page_code(data);
        const exec_result = await compile_server_svelte(content, file);

        const rendered_result = await render_server_compiled_svelte(exec_result, data, file);
        const path = join(release_path, to_index(data.url, data._wyvr.extension));
        if (rendered_result?.result) {
            // extract media files
            const media_result = await replace_media(rendered_result.result.html);
            if (media_result.has_media) {
                has_media = true;
                Object.keys(media_result.media).forEach((key) => {
                    media_files[key] = media_result.media[key];
                });
            }
            content = media_result.content;

            // inject translations
            if (data._wyvr.language) {
                content = content.replace(
                    /<\/body>/,
                    `<script>window._translations = ${stringify(get_language(data._wyvr.language))};</script></body>`
                );
            }

            // write the html code
            write(path, content);

            // write css
            if (filled_string(identifier) && search_segment(rendered_result.result, 'css.code')) {
                const css_file_path = join(Cwd.get(), FOLDER_GEN_CSS, `${identifier}.css`);
                if (!exists(css_file_path)) {
                    const mqf = split_css_into_media_query_files(rendered_result.result.css.code, css_file_path);
                    if (mqf) {
                        media_query_files[sep + join(FOLDER_CSS, to_relative_path(css_file_path))] = mqf;
                        has_media_query_files = true;
                    } else {
                        write(css_file_path, rendered_result.result.css.code);
                    }
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
    if (has_media_query_files) {
        const media_query_files_emit = {
            type: WorkerEmit.media_query_files,
            media_query_files,
        };
        send_action(WorkerAction.emit, media_query_files_emit);
    }
}
