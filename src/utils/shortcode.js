import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { compile_server_svelte } from './compile.js';
import { render_server_compiled_svelte } from './compile_svelte.js';
import { to_extension } from './file.js';
import { create_hash } from './hash.js';
import { Logger } from './logger.js';

export async function replace_shortcode(html, data, file) {
    let shortcode_imports;
    const src_path = Cwd.get(FOLDER_GEN_SRC);
    const replaced_content = html.replace(/\(\(([\s\S]*?)\)\)/g, (_, inner) => {
        const match = inner.match(/([^ ]*)([\s\S]*)/);
        let name, path, value;

        if (match) {
            value = match[1];
        } else {
            // ignore when something went wrong
            if (Env.is_dev()) {
                Logger.warning('shortcode can not be replaced in', file, match);
            }
            return match;
        }

        // check wheter the path was given or the name
        if (value.indexOf('/') > -1) {
            name = value.replace(/\//g, '_');
            path = `${src_path}/${value}.svelte`;
        } else {
            name = value;
            path = `${src_path}/${value.replace(/_/g, '/')}.svelte`;
        }
        name = name.replace(/_(.)/g, (m, $1) => $1.toUpperCase()).replace(/^(.)/g, (m, $1) => $1.toUpperCase());
        if (!shortcode_imports) {
            shortcode_imports = {};
        }
        shortcode_imports[name] = path;
        const data = match[2];
        const props = {};
        const data_length = data.length;
        let parentese = 0;
        let prop_name = '';
        let prop_value = '';
        for (let i = 0; i < data_length; i++) {
            const char = data[i];
            if (char == '{') {
                parentese++;
                if (parentese == 1) {
                    continue;
                }
            }
            if (char == '}') {
                parentese--;
                if (parentese == 0) {
                    try {
                        const prop_exec = `JSON.stringify(${prop_value})`;
                        prop_value = eval(prop_exec);
                    } catch (e) {
                        Logger.debug('shortcode props can not be converted in', file, 'for', prop_name.trim());
                    }
                    props[prop_name.trim()] = prop_value.replace(/\n\s*/gm, ''); //.replace(/"/g, '&quot;');
                    prop_name = '';
                    prop_value = '';
                    continue;
                }
            }
            if (char != '=' && parentese == 0) {
                prop_name += char;
            }
            if (parentese > 0) {
                prop_value += char;
            }
        }
        const props_component = Object.keys(props)
            .map((key) => {
                return `${key}={${props[key]}}`;
            })
            .join(' ');

        return `<${name} ${props_component} />`;
    });
    if (shortcode_imports) {
        const keys = Object.keys(shortcode_imports);
        const identifier = create_hash(keys.join('|'));
        const cache_breaker = Env.is_dev() ? `?${Date.now()}` : '';
        const shortcode_content = `<script>${keys
            .map((key) => `import ${key} from '${to_extension( shortcode_imports[key], 'js')}${cache_breaker}';`)
            .join('\n')}</script>${replaced_content}`;
        const exec_result = await compile_server_svelte(shortcode_content, file);

        const rendered_result = await render_server_compiled_svelte(exec_result, data, file);

        if (rendered_result?.result?.html) {
            // inject shortcode file
            const html = rendered_result.result.html.replace(/<\/body>/, `<script defer src="/js/${identifier}.js"></script></body>`);
            return { html, shortcode_imports, identifier };
        }
    }
    return { html: replaced_content, shortcode_imports: undefined, identifier: undefined };
}
