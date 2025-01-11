import esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { FOLDER_CLIENT, FOLDER_CSS, FOLDER_GEN_TEMP } from '../constants/folder.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { insert_import } from './compile.js';
import { write_css_file } from './css.js';
import { add_devtools_code } from './devtools.js';
import { get_error_message } from './error.js';
import { exists, read, remove, to_index, write } from './file.js';
import { get_language } from './i18n.js';
import { stringify } from './json.js';
import { Logger } from './logger.js';
import { get_cache_keys, replace_media } from './media.js';
import { search_segment } from './segment.js';
import { replace_shortcode } from './shortcode.js';
import { uniq_id } from './uniq.js';
import { filled_array, filled_string, is_func } from './validate.js';
import { Config } from './config.js';
import { STORAGE_OPTIMIZE_MEDIA_QUERY_FILES } from '../constants/storage.js';
import { KeyValue } from './database/key_value.js';
import { inject_csp } from '../model/csp.js';

const media_query_files_db = new KeyValue(STORAGE_OPTIMIZE_MEDIA_QUERY_FILES);

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
                    compilerOptions: { css: 'injected', dev: Env.is_dev() },
                    filterWarnings: (warning) => {
                        if (!Config.get('svelte.warnings', true)) {
                            return false;
                        }
                        // ignore some warnings
                        if (warning.code === 'css-unused-selector' && warning.message.indexOf('[data-slot=') > -1) {
                            return false;
                        }
                        Logger.warning(get_error_message(warning, file, 'svelte'));
                        return false;
                    }
                })
            ]
        });
        code = insert_import(read(tmp_file), file, FOLDER_CLIENT);
        code = code.replace(/\/\/# sourceMappingURL=[^.]+\.js\.map/g, '// %sourcemap%');
    } catch (e) {
        Logger.error(get_error_message(e, file, 'build'));
    }
    remove(tmp_file);
    const tmp_sourcemap = `${tmp_file}.map`;
    const sourcemap = read(tmp_sourcemap);

    remove(tmp_sourcemap);
    return { code, sourcemap };
}

export function inject_script(content, scripts) {
    if (!filled_array(scripts)) {
        return content;
    }
    const nonce = uniq_id();
    addCspNonce(nonce);
    const code = scripts.filter(Boolean).join('\n');
    return content.replace(/<\/body>/, `<script nonce="${nonce}">${code}</script></body>`);
}
export function inject_events(content) {
    const nonce = uniq_id();
    addCspNonce(nonce);
    return content.replace(
        /<head([^>]*)>/,
        `<head$1><script nonce="${nonce}">window.on = (event_name, callback) => {
        if (!event_name || !callback) {
            return;
        }
        document.addEventListener(event_name, (e) => {
            const data = e && e.detail ? e.detail : null;
            callback(data);
        });
    };</script>`
    );
}

export function get_translations_script(language) {
    if (!filled_string(language)) {
        return '';
    }
    return `window._translations = ${stringify(get_language(language))};`;
}

export function get_media_script() {
    const cache = get_cache_keys();
    return `window._media = ${stringify(cache)};`;
}

export function get_stack_script() {
    const stack = global.dumpStack();
    if (!stack) {
        return '';
    }
    // after injection clear the stack to avoid population to other pages
    global.clearStack();
    return `window._stack = ${stringify(stack)};`;
}

export async function inject(rendered_result, data, file, identifier, shortcode_callback) {
    const media_files = {};
    let has_media = false;
    let media_query_files = {};

    let content = rendered_result?.result?.html || '';

    const path = ReleasePath.get(to_index(data?.url, data?.$wyvr?.extension));
    try {
        if (content) {
            // replace shortcodes
            const shortcode_result = await replace_shortcode(content, data, file);
            if (shortcode_result) {
                if (shortcode_result.identifier && shortcode_result.shortcode_imports) {
                    const shortcode_emit = {
                        type: WorkerEmit.identifier,
                        identifier: shortcode_result.identifier,
                        imports: shortcode_result.shortcode_imports
                    };

                    if (shortcode_result.media_query_files) {
                        for (const key of Object.keys(shortcode_result.media_query_files)) {
                            media_query_files[key] = shortcode_result.media_query_files[key];
                        }
                    }
                    if (is_func(shortcode_callback)) {
                        shortcode_callback(shortcode_emit);
                    }
                }

                // extract media files
                const media_result = await replace_media(shortcode_result.html);
                if (media_result.has_media) {
                    has_media = true;
                    for (const key of Object.keys(media_result.media)) {
                        media_files[key] = media_result.media[key];
                    }
                }
                content = media_result.content;
            }

            content = inject_csp(
                inject_events(
                    inject_script(content, [
                        // inject translations
                        get_translations_script(data?.$wyvr?.language),
                        // add the media cache keys to avoid using the domains
                        get_media_script(),
                        // add the current stack to the page
                        get_stack_script(),
                        // add the devtools
                        add_devtools_code(path, shortcode_result?.identifier, data)
                    ])
                )
            );

            if (!filled_string(identifier)) {
                identifier = shortcode_result.identifier;
            }

            // write css
            const css_file_path = ReleasePath.get(FOLDER_CSS, `${identifier}.css`);
            if (!global.cache) {
                global.cache = {};
            }
            let css_code = '';
            if (search_segment(rendered_result?.result, 'css.code')) {
                css_code = rendered_result.result.css.code;
            }
            if (!exists(css_file_path) || global.cache.force_media_query_files) {
                media_query_files = write_css_file(css_file_path, css_code, media_query_files);
                // store the media query files in the db
                const entries = Object.entries(media_query_files);
                for (const [key, value] of entries) {
                    if (!media_query_files_db.exists(key)) {
                        media_query_files_db.set(key, value);
                    }
                }
            }
        }
    } catch (e) {
        Logger.error(get_error_message(e, file, 'inject build'));
    }
    return { content: content || '', has_media, path, media_query_files };
}
