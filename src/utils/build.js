import esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { join } from 'path';
import { FOLDER_CLIENT, FOLDER_GEN_CSS, FOLDER_GEN_TEMP } from '../constants/folder.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { insert_import } from './compile.js';
import { Config } from './config.js';
import { write_css_file } from './css.js';
import { add_devtools_code } from './devtools.js';
import { get_error_message } from './error.js';
import { exists, read, remove, to_index, write } from './file.js';
import { get_language } from './i18n.js';
import { stringify } from './json.js';
import { Logger } from './logger.js';
import { replace_media } from './media.js';
import { search_segment } from './segment.js';
import { replace_shortcode } from './shortcode.js';
import { to_dirname } from './to.js';
import { uniq_id } from './uniq.js';
import { filled_string, is_func } from './validate.js';

export async function build(content, file, format = 'iife') {
    if (!filled_string(content) || !filled_string(content)) {
        return { code: undefined, sourcemap: undefined };
    }
    const tmp_file = Cwd.get(FOLDER_GEN_TEMP, `${uniq_id()}.js`);
    let code;
    write(tmp_file, content);
    try {
        await esbuild.build({
            entryPoints: [tmp_file],
            outfile: tmp_file,
            allowOverwrite: true,
            sourcemap: true,
            minify: Env.is_prod(),
            format,
            bundle: true,
            platform: 'browser',
            treeShaking: true,
            logLevel: 'silent',
            plugins: [
                sveltePlugin({
                    compilerOptions: { css: true, dev: Env.is_dev() },
                    filterWarnings: (warning) => {
                        // ignore some warnings
                        if (warning.code == 'css-unused-selector' && warning.message.indexOf('[data-slot=') > -1) {
                            return false;
                        }
                        Logger.warning(get_error_message(warning, file, 'svelte'));
                        return false;
                    },
                }),
            ],
        });
        code = insert_import(read(tmp_file), file, FOLDER_CLIENT);
        code = code.replace(/\/\/# sourceMappingURL=[^.]+\.js\.map/g, '// %sourcemap%');
    } catch (e) {
        Logger.error(get_error_message(e, file, 'build'));
    }
    remove(tmp_file);
    const tmp_sourcemap = tmp_file + '.map';
    const sourcemap = read(tmp_sourcemap);

    remove(tmp_sourcemap);
    return { code, sourcemap };
}

const lib_dir = join(to_dirname(import.meta.url), '..');

export function inject_client_socket(content) {
    const wsport = Config.get('wsport');
    if (Env.is_prod() || !wsport) {
        return content;
    }
    const script = read(join(lib_dir, 'resource', 'client_socket.js')).replace(/\{port\}/g, wsport + '');
    const socket_script = `<script id="wyvr_client_socket">${script}</script></body>`;

    return content.replace(/<\/body>/, socket_script);
}

export function inject_translations(content, language) {
    if (!filled_string(language)) {
        return content;
    }
    return content.replace(
        /<\/body>/,
        `<script>window._translations = ${stringify(get_language(language))};</script></body>`
    );
}

export async function inject(rendered_result, data, file, identifier, shortcode_callback) {
    const release_path = ReleasePath.get();
    const media_files = {};
    let has_media = false;
    let media_query_files = {};

    let content = rendered_result?.result?.html || '';

    const path = join(release_path, to_index(data?.url, data?._wyvr?.extension));
    try {
        if (content) {
            // replace shortcodes
            const shortcode_result = await replace_shortcode(content, data, file);
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
                    if (is_func(shortcode_callback)) {
                        shortcode_callback(shortcode_emit);
                    }
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
            content = add_devtools_code(content, path, data);

            if (!filled_string(identifier)) {
                identifier = shortcode_result.identifier;
            }

            // write css
            if (search_segment(rendered_result?.result, 'css.code')) {
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
    } catch (e) {
        Logger.error(get_error_message(e, file, 'inject build'));
    }
    return { content: content || '', has_media, path };
}
