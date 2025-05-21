import { join } from 'node:path';
import { FOLDER_CSS, FOLDER_GEN_SRC } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { dev_cache_breaker } from './cache_breaker.js';
import { compile_server_svelte } from './compile.js';
import { render_server_compiled_svelte } from './compile_svelte.js';
import { write_css_file } from './css.js';
import { exists, to_extension } from './file.js';
import { create_hash } from './hash.js';
import { Logger } from './logger.js';
import { filled_object, filled_string, is_null, match_interface } from './validate.js';

export async function replace_shortcode(html, data, file) {
    if (!filled_string(html) || !filled_string(file)) {
        return undefined;
    }
    let shortcode_imports;
    let media_query_files = {};
    const replaced_content = html.replace(/\(\(([\s\S]*?)\)\)/g, (_, inner) => {
        const shortcode_parts = inner.match(/([^ ]*)([\s\S]*)/);
        const error_messages = ['shortcode', _, 'can not be replaced in', file];

        /* c8 ignore start */
        if (!shortcode_parts) {
            // ignore found shortcode when something went wrong or it doesn't match
            if (Env.is_dev()) {
                Logger.warning(...error_messages);
            }
            return _;
        }
        /* c8 ignore end */

        const shortcode = get_shortcode_data(shortcode_parts[1], shortcode_parts[2], file);

        /* c8 ignore start */
        if (!match_interface(shortcode, { tag: true, path: true })) {
            // ignore shortcode when something went wrong
            if (Env.is_dev()) {
                Logger.warning(...error_messages, 'because there was an error');
            }
            return _;
        }
        /* c8 ignore end */

        // check if the file exists
        const exists_path = [shortcode.path, to_extension(shortcode.path, 'js')].find((path) => exists(path));
        if (!exists_path) {
            Logger.warning(...error_messages, 'because the file does not exist');
            return _;
        }

        if (!shortcode_imports) {
            shortcode_imports = {};
        }
        shortcode_imports[shortcode.tag] = shortcode.path;

        if (is_null(shortcode.props)) {
            return `<${shortcode.tag} />`;
        }
        // build the properties for the shortcode
        const props_component = Object.keys(shortcode.props)
            .map((key) => {
                return `${key}={${shortcode.props[key]}}`;
            })
            .join(' ');

        return `<${shortcode.tag} ${props_component} />`;
    });
    if (shortcode_imports) {
        const keys = Object.keys(shortcode_imports);
        const identifier = create_hash(keys.join('|'));
        const shortcode_content = `<script>${keys
            .map((key) => `import ${key} from '${dev_cache_breaker(to_extension(shortcode_imports[key], 'js'))}';`)
            .join('\n')}</script>${replaced_content}`;
        const exec_result = await compile_server_svelte(shortcode_content, file);

        const [render_error, rendered_result] = await render_server_compiled_svelte(exec_result, data, file);

        if (render_error) {
            Logger.error('shortcode', 'error while rendering shortcode', file, render_error);
            return undefined;
        }
        // write css
        if (rendered_result?.result?.css?.code) {
            const css_file_path = ReleasePath.get(FOLDER_CSS, `${identifier}.css`);
            media_query_files = write_css_file(css_file_path, rendered_result.result.css.code, media_query_files);
        }

        if (rendered_result?.result?.html) {
            const cache_breaker = Env.is_dev() ? `?ts=${Date.now()}` : '';

            // inject shortcode files
            const html = rendered_result.result.html
                .replace(/<\/body>/, `<script defer src="/js/${identifier}.js${cache_breaker}"></script></body>`)
                .replace(
                    /<\/head>/,
                    `<link rel="preload" href="/css/${identifier}.css${cache_breaker}" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="/css/${identifier}.css${cache_breaker}"></noscript></head>`
                );
            return { html, shortcode_imports, identifier, media_query_files };
        }
    }
    return {
        html: replaced_content,
        shortcode_imports: undefined,
        identifier: undefined,
        media_query_files: undefined
    };
}

export function get_shortcode_data(name, props_value, file) {
    if (!filled_string(name) || !filled_string(file)) {
        return undefined;
    }
    const src_path = Cwd.get(FOLDER_GEN_SRC);

    let tag;
    let path;

    // check wheter the path was given or the name
    if (name.indexOf('/') > -1) {
        // path was given
        tag = name.replace(/\//g, '_');
        path = join(src_path, to_extension(name, 'svelte'));
    } else {
        // name was given
        tag = name;
        path = join(src_path, to_extension(name.replace(/_/g, '/'), 'svelte'));
    }
    tag = tag.replace(/_(.)/g, (_, $1) => $1.toUpperCase()).replace(/^(.)/g, (m, $1) => $1.toUpperCase());

    const props = parse_props(props_value, file);

    return { tag, path, props };
}

export function parse_props(prop_content, file) {
    if (!filled_string(prop_content) || !filled_string(file)) {
        return undefined;
    }
    const props = {};
    prop_content = prop_content.replace(/&quot;/g, '"');
    const data_length = prop_content.length;
    let parentese = 0;
    let prop_name = '';
    let prop_value = '';
    let name_is_done = false;
    let is_string = false;
    const set_prop = () => {
        parentese = 0;
        prop_name = prop_name.trim();
        try {
            const prop_exec = `JSON.stringify(${prop_value})`;
            // biome-ignore lint/security/noGlobalEval: <explanation>
            prop_value = eval(prop_exec);
            props[prop_name] = prop_value.replace(/\n\s*/gm, ''); //.replace(/"/g, '&quot;');
        } catch (e) {
            Logger.warning('shortcode', `shortcode prop "${prop_name}" can not be converted in ${file}`);
        }
        prop_name = '';
        prop_value = '';
        name_is_done = false;
        is_string = false;
    };
    for (let i = 0; i < data_length; i++) {
        const char = prop_content[i];
        if (char === '{') {
            parentese++;
            if (parentese === 1) {
                continue;
            }
        }
        if (char === '}') {
            parentese--;
            if (parentese === 0) {
                set_prop();
                continue;
            }
        }
        if (char !== '=' && parentese === 0 && !name_is_done) {
            prop_name += char;
            continue;
        }
        if (char === '=' && parentese === 0) {
            name_is_done = true;
            continue;
        }
        if (name_is_done && parentese === 0 && (char === '"' || char === "'")) {
            parentese++;
            is_string = true;
            continue;
        }
        if (name_is_done && parentese === 1 && is_string && (char === '"' || char === "'")) {
            prop_value = `"${prop_value}"`;
            set_prop();
            continue;
        }
        if (parentese > 0) {
            prop_value += char;
        }
    }
    if (!filled_object(props)) {
        return undefined;
    }
    return props;
}

export function parse_tag(content) {
    if (!filled_string(content)) {
        return undefined;
    }
    const data = {};
    let name_index = content.indexOf(' ');
    if (name_index == -1) {
        name_index = content.length;
    }
    data.tag = content.substring(0, name_index);
    content = content.substring(name_index).trim();
    if (!filled_string(content)) {
        return data;
    }
    const len = content.length;
    let attr_name = '';
    let attr_value = '';
    let found_equal = false;
    let no_quotes = false;
    let opened_value = false;
    data.attributes = {};
    for (let i = 0; i < len; i++) {
        const char = content[i];
        if (char == '=' && !opened_value) {
            no_quotes = content[i + 1] != '"';
            found_equal = true;
            continue;
        }
        if (!found_equal && char == ' ' && attr_name) {
            data.attributes[attr_name.trim()] = true;
            attr_name = '';
            attr_value = '';
            found_equal = false;
            continue;
        }
        if (!found_equal) {
            attr_name += char;
            continue;
        }
        if (!opened_value && char == '"') {
            opened_value = true;
            continue;
        }
        if (char == '"' || (no_quotes && char == ' ')) {
            data.attributes[attr_name.trim()] = attr_value;
            attr_name = '';
            attr_value = '';
            found_equal = false;
            opened_value = false;
            continue;
        }
        if (found_equal) {
            attr_value += char;
        }
    }

    if (attr_name && attr_value) {
        data.attributes[attr_name.trim()] = attr_value;
    }
    if (attr_name && !attr_value) {
        data.attributes[attr_name.trim()] = true;
    }
    return data;
}
